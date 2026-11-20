"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalEntryService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const safe_select_1 = require("@/utils/safe-select");
const CustomError_1 = require("@/errors/CustomError");
const accounting_1 = require("@/lib/accounting");
const ENTRY_INCLUDE = {
    fiscalYear: true,
    lines: { include: { account: { select: safe_select_1.ACCOUNT_SAFE_SELECT } } },
    reversalOf: true,
    reversedBy: true,
};
exports.JournalEntryService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {};
        if (query.search) {
            whereClause.OR = [
                { entryNo: { contains: query.search, mode: "insensitive" } },
                { description: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [entries, total] = await Promise.all([
            prismaClient_1.prismaMain.journalEntry.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: ENTRY_INCLUDE,
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.journalEntry.count({ where: whereClause }),
        ]);
        return {
            data: entries,
            pagination: { page, limit, total },
        };
    },
    /**
     * Creates a balanced double-entry posting. Entry validation (>= 2 lines,
     * debit XOR credit, balanced, active non-group accounts, FY open, date
     * inside FY) and JV-<FY>-<seq> numbering all happen in createJournalEntry,
     * inside this transaction; a P2002 seq collision retries once then 409s.
     */
    async create(data, userId) {
        return (0, accounting_1.withSequentialRetry)(() => prismaClient_1.prismaMain.$transaction(async (tx) => (0, accounting_1.createJournalEntry)(tx, {
            fiscalYearId: data.fiscalYearId,
            dateBs: data.dateBs,
            description: data.description,
            source: data.source,
            isManual: data.source === "MANUAL",
            lines: data.lines,
            createdBy: userId,
        })));
    },
    async getById(id) {
        const entry = await prismaClient_1.prismaMain.journalEntry.findUnique({
            where: { id },
            include: ENTRY_INCLUDE,
        });
        if (!entry) {
            throw new CustomError_1.CustomError("Journal entry not found", 404);
        }
        return entry;
    },
    /**
     * The only supported correction: posting a mirror reversal (debit/credit
     * swapped, reversalOfId set, original flagged isReversed). Reversing an
     * already-reversed entry — or a reversal itself — is rejected.
     */
    async reverse(id, input, userId) {
        return (0, accounting_1.withSequentialRetry)(() => prismaClient_1.prismaMain.$transaction(async (tx) => (0, accounting_1.reverseJournalEntry)(tx, id, {
            source: "REVERSAL",
            description: input.description,
            dateBs: input.dateBs,
            createdBy: userId,
        })));
    },
    /** Journal entries are append-only; deletion is never allowed. */
    async delete(_id, _userId) {
        throw new CustomError_1.CustomError("Journal entries are append-only and cannot be deleted; use POST /journal-entry/:id/reverse to correct them", 409);
    },
};
