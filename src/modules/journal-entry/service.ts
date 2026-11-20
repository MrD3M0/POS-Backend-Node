import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { ACCOUNT_SAFE_SELECT } from "@/utils/safe-select";
import { CustomError } from "@/errors/CustomError";
import {
  createJournalEntry,
  reverseJournalEntry,
  withSequentialRetry,
  type JournalEntryCreateInput,
} from "@/lib/accounting";

const ENTRY_INCLUDE = {
  fiscalYear: true,
  lines: { include: { account: { select: ACCOUNT_SAFE_SELECT } } },
  reversalOf: true,
  reversedBy: true,
} as const;

export const JournalEntryService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: Record<string, unknown> = {};

    if (query.search) {
      whereClause.OR = [
        { entryNo: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [entries, total] = await Promise.all([
      prismaMain.journalEntry.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: ENTRY_INCLUDE,
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.journalEntry.count({ where: whereClause }),
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
  async create(data: JournalEntryCreateInput, userId?: string) {
    return withSequentialRetry(() =>
      prismaMain.$transaction(async (tx) =>
        createJournalEntry(tx, {
          fiscalYearId: data.fiscalYearId,
          dateBs: data.dateBs,
          description: data.description,
          source: data.source,
          isManual: data.source === "MANUAL",
          lines: data.lines,
          createdBy: userId,
        }),
      ),
    );
  },

  async getById(id: string) {
    const entry = await prismaMain.journalEntry.findUnique({
      where: { id },
      include: ENTRY_INCLUDE,
    });

    if (!entry) {
      throw new CustomError("Journal entry not found", 404);
    }

    return entry;
  },

  /**
   * The only supported correction: posting a mirror reversal (debit/credit
   * swapped, reversalOfId set, original flagged isReversed). Reversing an
   * already-reversed entry — or a reversal itself — is rejected.
   */
  async reverse(
    id: string,
    input: { description?: string; dateBs?: string },
    userId?: string,
  ) {
    return withSequentialRetry(() =>
      prismaMain.$transaction(async (tx) =>
        reverseJournalEntry(tx, id, {
          source: "REVERSAL",
          description: input.description,
          dateBs: input.dateBs,
          createdBy: userId,
        }),
      ),
    );
  },

  /** Journal entries are append-only; deletion is never allowed. */
  async delete(_id: string, _userId?: string) {
    throw new CustomError(
      "Journal entries are append-only and cannot be deleted; use POST /journal-entry/:id/reverse to correct them",
      409,
    );
  },
};
