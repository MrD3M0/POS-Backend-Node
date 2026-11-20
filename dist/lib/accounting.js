"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextSequenceNo = nextSequenceNo;
exports.withSequentialRetry = withSequentialRetry;
exports.validateJournalLines = validateJournalLines;
exports.assertFiscalYearOpen = assertFiscalYearOpen;
exports.assertAccountsPostable = assertAccountsPostable;
exports.createJournalEntry = createJournalEntry;
exports.reverseJournalEntry = reverseJournalEntry;
const CustomError_1 = require("@/errors/CustomError");
const money_1 = require("./money");
const bs_date_1 = require("@/utils/bs-date");
const SEQUENCE_PAD_LENGTH = 6;
function padSequence(value) {
    return String(value).padStart(SEQUENCE_PAD_LENGTH, "0");
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
/**
 * Next sequential number for a prefix like "JV-2081/82-" or "RC-2081/82-".
 * Must be called inside a transaction; the model's @unique on the number
 * turns a concurrent max+1 collision (P2002) into the caller's one retry.
 */
async function nextSequenceNo(tx, options) {
    const delegate = tx[options.model].findMany;
    const rows = await delegate({
        where: { [options.field]: { startsWith: options.prefix } },
        select: { [options.field]: true },
    });
    const suffixPattern = new RegExp(`${escapeRegExp(options.prefix)}(\\d+)$`);
    let max = 0;
    for (const row of rows) {
        const match = suffixPattern.exec(row[options.field] ?? "");
        if (match) {
            max = Math.max(max, Number.parseInt(match[1], 10) || 0);
        }
    }
    return `${options.prefix}${padSequence(max + 1)}`;
}
/**
 * Runs a transaction body once and retries it once on a sequential-number
 * unique collision (P2002), then surfaces 409 (DECISIONS.md).
 */
async function withSequentialRetry(run) {
    try {
        return await run();
    }
    catch (error) {
        if (error?.code !== "P2002")
            throw error;
        try {
            return await run();
        }
        catch (retryError) {
            if (retryError?.code === "P2002") {
                throw new CustomError_1.CustomError("Sequential number conflict, please retry", 409);
            }
            throw retryError;
        }
    }
}
/** Validates the shape and balance of a set of journal lines (Decimal only). */
function validateJournalLines(lines) {
    if (!lines || lines.length < 2) {
        throw new CustomError_1.CustomError("A journal entry requires at least 2 lines", 400);
    }
    const normalized = lines.map((line, index) => {
        const position = `Line ${index + 1}`;
        const debit = (0, money_1.dec)(line.debit ?? "0", `${position} debit`);
        const credit = (0, money_1.dec)(line.credit ?? "0", `${position} credit`);
        if (debit.isNegative() || credit.isNegative()) {
            throw new CustomError_1.CustomError(`${position}: debit and credit cannot be negative`, 400);
        }
        // Exactly one side must carry the amount (XOR) — matches constraints.sql.
        if (debit.isPositive() === credit.isPositive()) {
            throw new CustomError_1.CustomError(`${position}: each line must set exactly one of debit or credit`, 400);
        }
        return {
            accountId: line.accountId,
            debit,
            credit,
            description: line.description,
            studentId: line.studentId ?? null,
            employeeId: line.employeeId ?? null,
        };
    });
    const totalDebit = (0, money_1.sumMoney)(normalized.map((line) => line.debit));
    const totalCredit = (0, money_1.sumMoney)(normalized.map((line) => line.credit));
    if (!(0, money_1.moneyEq)(totalDebit, totalCredit)) {
        throw new CustomError_1.CustomError(`Total debit (${(0, money_1.moneyStr)(totalDebit)}) must equal total credit (${(0, money_1.moneyStr)(totalCredit)})`, 400);
    }
    return normalized;
}
function assertFiscalYearOpen(fiscalYear) {
    if (fiscalYear.isClosed) {
        throw new CustomError_1.CustomError(`Fiscal year ${fiscalYear.name} is closed; postings are rejected`, 400);
    }
}
async function assertAccountsPostable(tx, accountIds) {
    const uniqueIds = [...new Set(accountIds)];
    if (uniqueIds.length === 0)
        return;
    const accounts = await tx.account.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true, code: true, isActive: true, isGroup: true, deletedAt: true },
    });
    const byId = new Map(accounts.map((account) => [account.id, account]));
    for (const id of uniqueIds) {
        const account = byId.get(id);
        if (!account || account.deletedAt) {
            throw new CustomError_1.CustomError(`Account ${id} not found`, 404);
        }
        if (account.isGroup) {
            throw new CustomError_1.CustomError(`Account ${account.code} is a group heading and cannot receive postings`, 400);
        }
        if (!account.isActive) {
            throw new CustomError_1.CustomError(`Account ${account.code} is inactive`, 400);
        }
    }
}
async function loadFiscalYear(tx, fiscalYearId) {
    const fiscalYear = await tx.fiscalYear.findFirst({
        where: { id: fiscalYearId, deletedAt: null },
    });
    if (!fiscalYear)
        throw new CustomError_1.CustomError("Fiscal year not found", 404);
    return fiscalYear;
}
async function assertPartiesExist(tx, lines) {
    const studentIds = [
        ...new Set(lines.map((line) => line.studentId).filter((id) => Boolean(id))),
    ];
    const employeeIds = [
        ...new Set(lines.map((line) => line.employeeId).filter((id) => Boolean(id))),
    ];
    if (studentIds.length > 0) {
        const students = await tx.student.findMany({
            where: { id: { in: studentIds }, deletedAt: null },
            select: { id: true },
        });
        if (students.length !== studentIds.length) {
            throw new CustomError_1.CustomError("One or more journal line students not found", 404);
        }
    }
    if (employeeIds.length > 0) {
        const employees = await tx.employee.findMany({
            where: { id: { in: employeeIds }, deletedAt: null },
            select: { id: true },
        });
        if (employees.length !== employeeIds.length) {
            throw new CustomError_1.CustomError("One or more journal line employees not found", 404);
        }
    }
}
/**
 * Creates a balanced journal entry (with lines) inside the caller's
 * transaction. Callers wrap it so a P2002 on entryNo retries the whole
 * transaction once (see withSequentialRetry).
 */
async function createJournalEntry(tx, input) {
    const dateBs = (0, bs_date_1.assertBsDate)(input.dateBs, "dateBs");
    const description = input.description?.trim();
    if (!description) {
        throw new CustomError_1.CustomError("Journal entry description is required", 400);
    }
    const lines = validateJournalLines(input.lines);
    const fiscalYear = await loadFiscalYear(tx, input.fiscalYearId);
    assertFiscalYearOpen(fiscalYear);
    if (!(0, bs_date_1.isBsDateWithinRange)(dateBs, fiscalYear.startDateBs, fiscalYear.endDateBs)) {
        throw new CustomError_1.CustomError(`Entry date ${dateBs} is outside fiscal year ${fiscalYear.name} (${fiscalYear.startDateBs} to ${fiscalYear.endDateBs})`, 400);
    }
    await assertAccountsPostable(tx, lines.map((line) => line.accountId));
    await assertPartiesExist(tx, lines);
    const entryNo = await nextSequenceNo(tx, {
        model: "journalEntry",
        field: "entryNo",
        prefix: `JV-${fiscalYear.name}-`,
    });
    return tx.journalEntry.create({
        data: {
            entryNo,
            fiscalYearId: fiscalYear.id,
            dateBs,
            description,
            source: input.source,
            sourceRefId: input.sourceRefId ?? null,
            isManual: input.isManual ?? input.source === "MANUAL",
            isBackdated: (0, bs_date_1.isBackdatedBsDate)(dateBs),
            createdBy: input.createdBy,
            lines: {
                create: lines.map((line) => ({
                    accountId: line.accountId,
                    debit: line.debit,
                    credit: line.credit,
                    description: line.description ?? null,
                    studentId: line.studentId,
                    employeeId: line.employeeId,
                    createdBy: input.createdBy,
                })),
            },
        },
        include: {
            fiscalYear: true,
            lines: { include: { account: true } },
        },
    });
}
/**
 * Reverses a journal entry: creates a mirror entry with debit/credit swapped,
 * links it via reversalOfId and flags the original isReversed. Corrections
 * are reversal-only — a reversal entry cannot itself be reversed.
 */
async function reverseJournalEntry(tx, entryId, options = {}) {
    const original = await tx.journalEntry.findUnique({
        where: { id: entryId },
        include: { lines: true },
    });
    if (!original)
        throw new CustomError_1.CustomError("Journal entry not found", 404);
    if (original.isReversed) {
        throw new CustomError_1.CustomError(`Journal entry ${original.entryNo} is already reversed`, 400);
    }
    if (original.reversalOfId) {
        throw new CustomError_1.CustomError("A reversal entry cannot itself be reversed", 400);
    }
    const dateBs = (0, bs_date_1.assertBsDate)(options.dateBs ?? original.dateBs, "dateBs");
    const fiscalYear = await loadFiscalYear(tx, original.fiscalYearId);
    assertFiscalYearOpen(fiscalYear);
    if (!(0, bs_date_1.isBsDateWithinRange)(dateBs, fiscalYear.startDateBs, fiscalYear.endDateBs)) {
        throw new CustomError_1.CustomError(`Reversal date ${dateBs} is outside fiscal year ${fiscalYear.name} (${fiscalYear.startDateBs} to ${fiscalYear.endDateBs})`, 400);
    }
    const entryNo = await nextSequenceNo(tx, {
        model: "journalEntry",
        field: "entryNo",
        prefix: `JV-${fiscalYear.name}-`,
    });
    const reversal = await tx.journalEntry.create({
        data: {
            entryNo,
            fiscalYearId: fiscalYear.id,
            dateBs,
            description: options.description?.trim() ?? `Reversal of ${original.entryNo}`,
            source: (options.source ?? "REVERSAL"),
            sourceRefId: options.sourceRefId ?? original.sourceRefId ?? null,
            isManual: (options.source ?? "REVERSAL") === "REVERSAL",
            isBackdated: (0, bs_date_1.isBackdatedBsDate)(dateBs),
            reversalOfId: original.id,
            createdBy: options.createdBy,
            lines: {
                create: original.lines.map((line) => ({
                    accountId: line.accountId,
                    debit: line.credit,
                    credit: line.debit,
                    description: line.description
                        ? `Reversal: ${line.description}`
                        : null,
                    studentId: line.studentId,
                    employeeId: line.employeeId,
                    createdBy: options.createdBy,
                })),
            },
        },
        include: {
            fiscalYear: true,
            lines: { include: { account: true } },
            reversalOf: true,
        },
    });
    await tx.journalEntry.update({
        where: { id: original.id },
        data: { isReversed: true, updatedBy: options.createdBy },
    });
    return reversal;
}
