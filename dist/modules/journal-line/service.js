"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalLineService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const safe_select_1 = require("@/utils/safe-select");
const CustomError_1 = require("@/errors/CustomError");
const accounting_1 = require("@/lib/accounting");
const money_1 = require("@/lib/money");
exports.JournalLineService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {};
        if (query.search) {
            whereClause.OR = [
                { accountId: { contains: query.search, mode: "insensitive" } },
                { studentId: { contains: query.search, mode: "insensitive" } },
                { employeeId: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [lines, total] = await Promise.all([
            prismaClient_1.prismaMain.journalLine.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    account: { select: safe_select_1.ACCOUNT_SAFE_SELECT },
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.journalLine.count({ where: whereClause }),
        ]);
        return {
            data: lines,
            pagination: { page, limit, total },
        };
    },
    /**
     * Totals per account (debit / credit) for the ledger list.
     *
     * The ledger page used to sum the lines itself, which meant one request of
     * up to 1000 lines per account on the page. This is a single grouped query
     * instead.
     */
    async totalsByAccount() {
        const rows = await prismaClient_1.prismaMain.journalLine.groupBy({
            by: ["accountId"],
            _sum: { debit: true, credit: true },
        });
        return rows.map((row) => ({
            accountId: row.accountId,
            totalDebit: Number(row._sum.debit ?? 0),
            totalCredit: Number(row._sum.credit ?? 0),
        }));
    },
    /**
     * Adds one line to an existing entry. Preferred path is POST /journal-entry
     * with nested lines (which validates the whole entry balances); this
     * endpoint applies the same per-line rules: debit XOR credit, both >= 0,
     * active non-group account, and the parent entry still open.
     */
    async create(data, userId) {
        const debit = (0, money_1.dec)(data.debit ?? "0", "debit");
        const credit = (0, money_1.dec)(data.credit ?? "0", "credit");
        if (debit.isNegative() || credit.isNegative()) {
            throw new CustomError_1.CustomError("Debit and credit cannot be negative", 400);
        }
        if (debit.isPositive() === credit.isPositive()) {
            throw new CustomError_1.CustomError("Each journal line must set exactly one of debit or credit", 400);
        }
        const entry = await prismaClient_1.prismaMain.journalEntry.findUnique({
            where: { id: data.journalEntryId },
            include: { fiscalYear: true },
        });
        if (!entry) {
            throw new CustomError_1.CustomError("Journal entry not found", 404);
        }
        if (entry.isReversed) {
            throw new CustomError_1.CustomError("Cannot add lines to a reversed journal entry; use POST /journal-entry/:id/reverse to correct it", 409);
        }
        (0, accounting_1.assertFiscalYearOpen)(entry.fiscalYear);
        await (0, accounting_1.assertAccountsPostable)(prismaClient_1.prismaMain, [data.accountId]);
        const line = await prismaClient_1.prismaMain.journalLine.create({
            data: {
                journalEntryId: data.journalEntryId,
                accountId: data.accountId,
                debit,
                credit,
                description: data.description ?? null,
                studentId: data.studentId ?? null,
                employeeId: data.employeeId ?? null,
                ...(userId && { createdBy: userId }),
            },
            include: {
                account: { select: safe_select_1.ACCOUNT_SAFE_SELECT },
            },
        });
        return line;
    },
    async getById(id) {
        const line = await prismaClient_1.prismaMain.journalLine.findUnique({
            where: { id },
            include: {
                account: { select: safe_select_1.ACCOUNT_SAFE_SELECT },
            },
        });
        if (!line) {
            throw new CustomError_1.CustomError("Journal line not found", 404);
        }
        return line;
    },
    /** Journal lines are append-only; deletion is never allowed. */
    async delete(_id, _userId) {
        throw new CustomError_1.CustomError("Journal lines are append-only and cannot be deleted; reverse the whole journal entry instead", 409);
    },
};
