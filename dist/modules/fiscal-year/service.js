"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiscalYearService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
const audit_1 = require("@/lib/audit");
const bs_date_1 = require("@/utils/bs-date");
const money_1 = require("@/lib/money");
const ACCOUNT_TYPE_ORDER = [
    "ASSET",
    "LIABILITY",
    "EQUITY",
    "INCOME",
    "EXPENSE",
];
/**
 * A journal entry is balanced when debit == credit across all of its lines.
 * Grouping in the client keeps the check independent of how many entries a
 * fiscal year holds (the set is small and already bounded by the year).
 */
function unbalancedEntryCount(lines) {
    const totals = new Map();
    for (const line of lines) {
        const current = totals.get(line.journalEntryId) ?? {
            debit: (0, money_1.dec)(0),
            credit: (0, money_1.dec)(0),
        };
        current.debit = current.debit.plus(line._sum.debit ?? (0, money_1.dec)(0));
        current.credit = current.credit.plus(line._sum.credit ?? (0, money_1.dec)(0));
        totals.set(line.journalEntryId, current);
    }
    let unbalanced = 0;
    for (const { debit, credit } of totals.values()) {
        if (!(0, money_1.moneyEq)(debit, credit))
            unbalanced += 1;
    }
    return unbalanced;
}
async function trialBalanceByType(db, fiscalYearId) {
    const grouped = await db.journalLine.groupBy({
        by: ["accountId"],
        where: { journalEntry: { is: { fiscalYearId } } },
        _sum: { debit: true, credit: true },
    });
    if (grouped.length === 0)
        return [];
    const accountIds = grouped.map((row) => row.accountId);
    const accounts = await db.account.findMany({
        where: { id: { in: accountIds } },
        select: { id: true, type: true },
    });
    const typeByAccount = new Map(accounts.map((account) => [account.id, account.type]));
    const totals = new Map();
    for (const row of grouped) {
        const type = typeByAccount.get(row.accountId);
        if (!type)
            continue;
        const current = totals.get(type) ?? { debit: (0, money_1.dec)(0), credit: (0, money_1.dec)(0) };
        current.debit = current.debit.plus(row._sum.debit ?? (0, money_1.dec)(0));
        current.credit = current.credit.plus(row._sum.credit ?? (0, money_1.dec)(0));
        totals.set(type, current);
    }
    return ACCOUNT_TYPE_ORDER.filter((type) => totals.has(type)).map((type) => {
        const value = totals.get(type);
        return {
            type,
            debit: (0, money_1.moneyStr)(value.debit),
            credit: (0, money_1.moneyStr)(value.credit),
        };
    });
}
function assertDateOrder(startDateBs, endDateBs) {
    if (startDateBs > endDateBs) {
        throw new CustomError_1.CustomError("Fiscal year startDateBs must be on or before endDateBs", 400);
    }
}
function assertFiscalYearBounds(startDateBs, endDateBs) {
    const start = (0, bs_date_1.parseBsDate)(startDateBs);
    const end = (0, bs_date_1.parseBsDate)(endDateBs);
    if (!start || !end)
        throw new CustomError_1.CustomError("Fiscal year dates must be valid BS dates", 400);
    if (start.month !== 4 || start.day !== 1) {
        throw new CustomError_1.CustomError("Fiscal year must start on Shrawan 1 (YYYY-04-01 BS)", 400);
    }
    if (end.month !== 3) {
        throw new CustomError_1.CustomError("Fiscal year must end in Asar (month 03) BS", 400);
    }
}
exports.FiscalYearService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 50);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = { deletedAt: null };
        if (query.search) {
            whereClause.OR = [{ name: { contains: query.search, mode: "insensitive" } }];
        }
        const [years, total] = await Promise.all([
            prismaClient_1.prismaMain.fiscalYear.findMany({ where: whereClause, skip, take: (0, queryFilters_1.toPrismaTake)(limit), orderBy: { startDateBs: "desc" } }),
            prismaClient_1.prismaMain.fiscalYear.count({ where: whereClause }),
        ]);
        return { data: years, pagination: { page, limit, total } };
    },
    async create(data, userId) {
        assertDateOrder(data.startDateBs, data.endDateBs);
        assertFiscalYearBounds(data.startDateBs, data.endDateBs);
        try {
            return await prismaClient_1.prismaMain.$transaction(async (tx) => {
                if (data.isCurrent) {
                    await tx.fiscalYear.updateMany({
                        where: { isCurrent: true, deletedAt: null },
                        data: { isCurrent: false, updatedBy: userId },
                    });
                }
                const year = await tx.fiscalYear.create({
                    data: {
                        name: data.name,
                        startDateBs: data.startDateBs,
                        endDateBs: data.endDateBs,
                        isCurrent: data.isCurrent ?? false,
                        isClosed: data.isClosed ?? false,
                        createdBy: userId,
                    },
                });
                await (0, audit_1.writeAudit)(tx, { entity: "FiscalYear", entityId: year.id, action: "CREATE", newValues: year, userId });
                return year;
            });
        }
        catch (error) {
            if (error?.code === "P2002") {
                throw new CustomError_1.CustomError("A fiscal year with this name already exists", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const year = await prismaClient_1.prismaMain.fiscalYear.findFirst({ where: { id, deletedAt: null } });
        if (!year)
            throw new CustomError_1.CustomError("Fiscal year not found", 404);
        return year;
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.fiscalYear.findFirst({ where: { id, deletedAt: null } });
        if (!existing)
            throw new CustomError_1.CustomError("Fiscal year not found", 404);
        if (existing.isClosed)
            throw new CustomError_1.CustomError("A closed fiscal year cannot be edited", 409);
        const startDateBs = data.startDateBs ?? existing.startDateBs;
        const endDateBs = data.endDateBs ?? existing.endDateBs;
        assertDateOrder(startDateBs, endDateBs);
        if (data.startDateBs || data.endDateBs)
            assertFiscalYearBounds(startDateBs, endDateBs);
        try {
            return await prismaClient_1.prismaMain.$transaction(async (tx) => {
                if (data.isCurrent === true) {
                    await tx.fiscalYear.updateMany({
                        where: { isCurrent: true, deletedAt: null, id: { not: id } },
                        data: { isCurrent: false, updatedBy: userId },
                    });
                }
                const year = await tx.fiscalYear.update({
                    where: { id },
                    data: {
                        name: data.name ?? existing.name,
                        startDateBs,
                        endDateBs,
                        isCurrent: data.isCurrent ?? existing.isCurrent,
                        // isClosed is managed only by the close action.
                        updatedBy: userId,
                    },
                });
                await (0, audit_1.writeAudit)(tx, { entity: "FiscalYear", entityId: id, action: "UPDATE", oldValues: existing, newValues: year, userId });
                return year;
            });
        }
        catch (error) {
            if (error?.code === "P2002") {
                throw new CustomError_1.CustomError("A fiscal year with this name already exists", 409);
            }
            throw error;
        }
    },
    async setCurrent(id, userId) {
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            const year = await tx.fiscalYear.findFirst({ where: { id, deletedAt: null } });
            if (!year)
                throw new CustomError_1.CustomError("Fiscal year not found", 404);
            if (year.isClosed)
                throw new CustomError_1.CustomError("A closed fiscal year cannot be set as current", 409);
            await tx.fiscalYear.updateMany({
                where: { isCurrent: true, deletedAt: null, id: { not: id } },
                data: { isCurrent: false, updatedBy: userId },
            });
            const updated = await tx.fiscalYear.update({
                where: { id },
                data: { isCurrent: true, updatedBy: userId },
            });
            await (0, audit_1.writeAudit)(tx, {
                entity: "FiscalYear",
                entityId: id,
                action: "SET_CURRENT",
                oldValues: { isCurrent: year.isCurrent },
                newValues: { isCurrent: true },
                userId,
            });
            return updated;
        });
    },
    async closePreview(id) {
        const year = await prismaClient_1.prismaMain.fiscalYear.findFirst({ where: { id, deletedAt: null } });
        if (!year)
            throw new CustomError_1.CustomError("Fiscal year not found", 404);
        const [pendingPayrolls, lines] = await Promise.all([
            prismaClient_1.prismaMain.payroll.count({ where: { fiscalYearId: id, status: { in: ["DRAFT", "PENDING"] } } }),
            prismaClient_1.prismaMain.journalLine.groupBy({
                by: ["journalEntryId"],
                _sum: { debit: true, credit: true },
            }),
        ]);
        const unbalanced = unbalancedEntryCount(lines);
        const balances = await trialBalanceByType(prismaClient_1.prismaMain, id);
        const blockers = [];
        if (pendingPayrolls > 0)
            blockers.push(`${pendingPayrolls} payroll run(s) are still DRAFT/PENDING`);
        if (unbalanced > 0)
            blockers.push(`${unbalanced} journal entry(ies) are unbalanced`);
        return {
            fiscalYear: year,
            blockers,
            canClose: blockers.length === 0 && !year.isClosed,
            trialBalanceByType: balances,
            note: "Closing marks the fiscal year closed and blocks posting in that year. Automatic CLOSING journal entry generation is not performed by this action (review balances and post a CLOSING entry through the approved accounting workflow if required).",
        };
    },
    async close(id, reason, userId) {
        if (!reason?.trim())
            throw new CustomError_1.CustomError("A reason is required to close a fiscal year", 400);
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            const year = await tx.fiscalYear.findFirst({ where: { id, deletedAt: null } });
            if (!year)
                throw new CustomError_1.CustomError("Fiscal year not found", 404);
            if (year.isClosed)
                throw new CustomError_1.CustomError("Fiscal year is already closed", 409);
            const pendingPayrolls = await tx.payroll.count({ where: { fiscalYearId: id, status: { in: ["DRAFT", "PENDING"] } } });
            if (pendingPayrolls > 0)
                throw new CustomError_1.CustomError(`Cannot close: ${pendingPayrolls} payroll run(s) are still DRAFT/PENDING`, 409);
            const unbalancedLines = await tx.journalLine.groupBy({
                by: ["journalEntryId"],
                _sum: { debit: true, credit: true },
            });
            const unbalanced = unbalancedEntryCount(unbalancedLines);
            if (unbalanced > 0)
                throw new CustomError_1.CustomError("Cannot close: trial balance has unbalanced journal entries", 409);
            const closed = await tx.fiscalYear.update({
                where: { id },
                data: { isClosed: true, isCurrent: false, updatedBy: userId },
            });
            await (0, audit_1.writeAudit)(tx, {
                entity: "FiscalYear",
                entityId: id,
                action: "CLOSE",
                oldValues: { isClosed: false },
                newValues: { isClosed: true, reason: reason.trim() },
                userId,
            });
            return { ...closed, closingJournalPosted: false, reason: reason.trim() };
        });
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.fiscalYear.findFirst({
            where: { id, deletedAt: null },
            include: { _count: { select: { journalEntries: true, payments: true, payrolls: true } } },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Fiscal year not found", 404);
        if (existing.isCurrent)
            throw new CustomError_1.CustomError("The current fiscal year cannot be deleted", 409);
        if (existing._count.journalEntries > 0 || existing._count.payments > 0 || existing._count.payrolls > 0) {
            throw new CustomError_1.CustomError("Fiscal year has financial postings and cannot be deleted; close it instead", 409);
        }
        await prismaClient_1.prismaMain.fiscalYear.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: userId } });
        return null;
    },
};
