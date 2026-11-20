import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { ACCOUNT_SAFE_SELECT } from "@/utils/safe-select";
import { CustomError } from "@/errors/CustomError";
import { JournalLineCreateInput } from "./validator";
import { assertAccountsPostable, assertFiscalYearOpen } from "@/lib/accounting";
import { dec } from "@/lib/money";

export const JournalLineService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: Record<string, unknown> = {};

    if (query.search) {
      whereClause.OR = [
        { accountId: { contains: query.search, mode: "insensitive" } },
        { studentId: { contains: query.search, mode: "insensitive" } },
        { employeeId: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [lines, total] = await Promise.all([
      prismaMain.journalLine.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: {
          account: { select: ACCOUNT_SAFE_SELECT },
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.journalLine.count({ where: whereClause }),
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
    const rows = await prismaMain.journalLine.groupBy({
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
  async create(data: JournalLineCreateInput, userId?: string) {
    const debit = dec(data.debit ?? "0", "debit");
    const credit = dec(data.credit ?? "0", "credit");

    if (debit.isNegative() || credit.isNegative()) {
      throw new CustomError("Debit and credit cannot be negative", 400);
    }
    if (debit.isPositive() === credit.isPositive()) {
      throw new CustomError(
        "Each journal line must set exactly one of debit or credit",
        400,
      );
    }

    const entry = await prismaMain.journalEntry.findUnique({
      where: { id: data.journalEntryId },
      include: { fiscalYear: true },
    });
    if (!entry) {
      throw new CustomError("Journal entry not found", 404);
    }
    if (entry.isReversed) {
      throw new CustomError(
        "Cannot add lines to a reversed journal entry; use POST /journal-entry/:id/reverse to correct it",
        409,
      );
    }
    assertFiscalYearOpen(entry.fiscalYear);

    await assertAccountsPostable(prismaMain, [data.accountId]);

    const line = await prismaMain.journalLine.create({
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
        account: { select: ACCOUNT_SAFE_SELECT },
      },
    });
    return line;
  },

  async getById(id: string) {
    const line = await prismaMain.journalLine.findUnique({
      where: { id },
      include: {
        account: { select: ACCOUNT_SAFE_SELECT },
      },
    });

    if (!line) {
      throw new CustomError("Journal line not found", 404);
    }

    return line;
  },

  /** Journal lines are append-only; deletion is never allowed. */
  async delete(_id: string, _userId?: string) {
    throw new CustomError(
      "Journal lines are append-only and cannot be deleted; reverse the whole journal entry instead",
      409,
    );
  },
};
