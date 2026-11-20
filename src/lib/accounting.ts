// Shared double-entry accounting helpers (features 7 + 8).
//
// Invariants enforced here (service layer) plus docs/constraints.sql (DB layer):
//  - a journal entry has >= 2 lines and total(debit) == total(credit)
//  - every line has exactly one of debit/credit (XOR), both >= 0
//  - lines only post to active, non-group, non-deleted accounts
//  - entryNo = JV-<fiscalYear.name>-<6-digit seq>, transaction-scoped max+1
//    with unique-constraint retry (DECISIONS.md cross-cutting rules)
//  - dateBs must sit inside its fiscal year; closed years reject postings
//  - corrections are reversals only (append-only, swap debit/credit); a
//    reversal cannot itself be reversed
import { Prisma, $Enums } from "../generated/prisma/client.js";
import { PrismaClient } from "../generated/prisma/client.js";
import { CustomError } from "@/errors/CustomError";
import { dec, moneyEq, moneyStr, sumMoney, type MoneyInput } from "./money";
import {
  assertBsDate,
  isBackdatedBsDate,
  isBsDateWithinRange,
} from "@/utils/bs-date";

/**
 * Structural type for anything carrying model delegates (the Prisma client or
 * a $transaction client). List every delegate the shared helpers touch.
 */
export type TxClient = Pick<
  PrismaClient,
  | "account"
  | "journalEntry"
  | "fiscalYear"
  | "student"
  | "studentFee"
  | "employee"
  | "feePayment"
  | "feePaymentAllocation"
  | "studentFeeItem"
  | "feeInstallment"
  | "paymentMethod"
>;

export type JournalSourceInput =
  | "MANUAL"
  | "FEE_PAYMENT"
  | "FEE_PAYMENT_CANCEL"
  | "PAYROLL"
  | "OPENING"
  | "REVERSAL"
  | "CLOSING";

export interface JournalLineInput {
  accountId: string;
  debit?: MoneyInput | null;
  credit?: MoneyInput | null;
  description?: string;
  studentId?: string | null;
  employeeId?: string | null;
}

export interface NormalizedJournalLine {
  accountId: string;
  debit: Prisma.Decimal;
  credit: Prisma.Decimal;
  description?: string;
  studentId?: string | null;
  employeeId?: string | null;
}

export interface CreateJournalEntryInput {
  fiscalYearId: string;
  dateBs: string;
  description: string;
  source: JournalSourceInput;
  sourceRefId?: string | null;
  isManual?: boolean;
  lines: JournalLineInput[];
  createdBy?: string;
}

/** Back-compat alias (journal-entry module imports this name). */
export type JournalEntryCreateInput = CreateJournalEntryInput;

const SEQUENCE_PAD_LENGTH = 6;

function padSequence(value: number): string {
  return String(value).padStart(SEQUENCE_PAD_LENGTH, "0");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type SequenceModel = "journalEntry" | "feePayment";
type SequenceField = "entryNo" | "receiptNo";

/**
 * Next sequential number for a prefix like "JV-2081/82-" or "RC-2081/82-".
 * Must be called inside a transaction; the model's @unique on the number
 * turns a concurrent max+1 collision (P2002) into the caller's one retry.
 */
export async function nextSequenceNo(
  tx: TxClient,
  options: { model: SequenceModel; field: SequenceField; prefix: string },
): Promise<string> {
  const delegate = tx[options.model].findMany as unknown as (
    args: Record<string, unknown>,
  ) => Promise<Array<Record<string, string>>>;
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
export async function withSequentialRetry<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if ((error as { code?: string } | null)?.code !== "P2002") throw error;
    try {
      return await run();
    } catch (retryError) {
      if ((retryError as { code?: string } | null)?.code === "P2002") {
        throw new CustomError(
          "Sequential number conflict, please retry",
          409,
        );
      }
      throw retryError;
    }
  }
}

/** Validates the shape and balance of a set of journal lines (Decimal only). */
export function validateJournalLines(
  lines: JournalLineInput[] | undefined | null,
): NormalizedJournalLine[] {
  if (!lines || lines.length < 2) {
    throw new CustomError(
      "A journal entry requires at least 2 lines",
      400,
    );
  }

  const normalized = lines.map((line, index) => {
    const position = `Line ${index + 1}`;
    const debit = dec(line.debit ?? "0", `${position} debit`);
    const credit = dec(line.credit ?? "0", `${position} credit`);

    if (debit.isNegative() || credit.isNegative()) {
      throw new CustomError(
        `${position}: debit and credit cannot be negative`,
        400,
      );
    }
    // Exactly one side must carry the amount (XOR) — matches constraints.sql.
    if (debit.isPositive() === credit.isPositive()) {
      throw new CustomError(
        `${position}: each line must set exactly one of debit or credit`,
        400,
      );
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

  const totalDebit = sumMoney(normalized.map((line) => line.debit));
  const totalCredit = sumMoney(normalized.map((line) => line.credit));
  if (!moneyEq(totalDebit, totalCredit)) {
    throw new CustomError(
      `Total debit (${moneyStr(totalDebit)}) must equal total credit (${moneyStr(totalCredit)})`,
      400,
    );
  }
  return normalized;
}

export interface FiscalYearLike {
  id: string;
  name: string;
  startDateBs: string;
  endDateBs: string;
  isClosed: boolean;
}

export function assertFiscalYearOpen(fiscalYear: FiscalYearLike): void {
  if (fiscalYear.isClosed) {
    throw new CustomError(
      `Fiscal year ${fiscalYear.name} is closed; postings are rejected`,
      400,
    );
  }
}

export async function assertAccountsPostable(
  tx: TxClient,
  accountIds: string[],
): Promise<void> {
  const uniqueIds = [...new Set(accountIds)];
  if (uniqueIds.length === 0) return;

  const accounts = await tx.account.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, code: true, isActive: true, isGroup: true, deletedAt: true },
  });
  const byId = new Map(accounts.map((account) => [account.id, account]));

  for (const id of uniqueIds) {
    const account = byId.get(id);
    if (!account || account.deletedAt) {
      throw new CustomError(`Account ${id} not found`, 404);
    }
    if (account.isGroup) {
      throw new CustomError(
        `Account ${account.code} is a group heading and cannot receive postings`,
        400,
      );
    }
    if (!account.isActive) {
      throw new CustomError(`Account ${account.code} is inactive`, 400);
    }
  }
}

async function loadFiscalYear(
  tx: TxClient,
  fiscalYearId: string,
): Promise<FiscalYearLike> {
  const fiscalYear = await tx.fiscalYear.findFirst({
    where: { id: fiscalYearId, deletedAt: null },
  });
  if (!fiscalYear) throw new CustomError("Fiscal year not found", 404);
  return fiscalYear;
}

async function assertPartiesExist(
  tx: TxClient,
  lines: NormalizedJournalLine[],
): Promise<void> {
  const studentIds = [
    ...new Set(lines.map((line) => line.studentId).filter((id): id is string => Boolean(id))),
  ];
  const employeeIds = [
    ...new Set(lines.map((line) => line.employeeId).filter((id): id is string => Boolean(id))),
  ];

  if (studentIds.length > 0) {
    const students = await tx.student.findMany({
      where: { id: { in: studentIds }, deletedAt: null },
      select: { id: true },
    });
    if (students.length !== studentIds.length) {
      throw new CustomError("One or more journal line students not found", 404);
    }
  }
  if (employeeIds.length > 0) {
    const employees = await tx.employee.findMany({
      where: { id: { in: employeeIds }, deletedAt: null },
      select: { id: true },
    });
    if (employees.length !== employeeIds.length) {
      throw new CustomError("One or more journal line employees not found", 404);
    }
  }
}

/**
 * Creates a balanced journal entry (with lines) inside the caller's
 * transaction. Callers wrap it so a P2002 on entryNo retries the whole
 * transaction once (see withSequentialRetry).
 */
export async function createJournalEntry(
  tx: TxClient,
  input: CreateJournalEntryInput,
) {
  const dateBs = assertBsDate(input.dateBs, "dateBs");
  const description = input.description?.trim();
  if (!description) {
    throw new CustomError("Journal entry description is required", 400);
  }

  const lines = validateJournalLines(input.lines);
  const fiscalYear = await loadFiscalYear(tx, input.fiscalYearId);
  assertFiscalYearOpen(fiscalYear);
  if (!isBsDateWithinRange(dateBs, fiscalYear.startDateBs, fiscalYear.endDateBs)) {
    throw new CustomError(
      `Entry date ${dateBs} is outside fiscal year ${fiscalYear.name} (${fiscalYear.startDateBs} to ${fiscalYear.endDateBs})`,
      400,
    );
  }

  await assertAccountsPostable(
    tx,
    lines.map((line) => line.accountId),
  );
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
      source: input.source as $Enums.JournalSource,
      sourceRefId: input.sourceRefId ?? null,
      isManual: input.isManual ?? input.source === "MANUAL",
      isBackdated: isBackdatedBsDate(dateBs),
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
export async function reverseJournalEntry(
  tx: TxClient,
  entryId: string,
  options: {
    source?: JournalSourceInput;
    sourceRefId?: string | null;
    description?: string;
    dateBs?: string;
    createdBy?: string;
  } = {},
) {
  const original = await tx.journalEntry.findUnique({
    where: { id: entryId },
    include: { lines: true },
  });
  if (!original) throw new CustomError("Journal entry not found", 404);
  if (original.isReversed) {
    throw new CustomError(
      `Journal entry ${original.entryNo} is already reversed`,
      400,
    );
  }
  if (original.reversalOfId) {
    throw new CustomError(
      "A reversal entry cannot itself be reversed",
      400,
    );
  }

  const dateBs = assertBsDate(options.dateBs ?? original.dateBs, "dateBs");
  const fiscalYear = await loadFiscalYear(tx, original.fiscalYearId);
  assertFiscalYearOpen(fiscalYear);
  if (!isBsDateWithinRange(dateBs, fiscalYear.startDateBs, fiscalYear.endDateBs)) {
    throw new CustomError(
      `Reversal date ${dateBs} is outside fiscal year ${fiscalYear.name} (${fiscalYear.startDateBs} to ${fiscalYear.endDateBs})`,
      400,
    );
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
      description:
        options.description?.trim() ?? `Reversal of ${original.entryNo}`,
      source: (options.source ?? "REVERSAL") as $Enums.JournalSource,
      sourceRefId: options.sourceRefId ?? original.sourceRefId ?? null,
      isManual: (options.source ?? "REVERSAL") === "REVERSAL",
      isBackdated: isBackdatedBsDate(dateBs),
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
