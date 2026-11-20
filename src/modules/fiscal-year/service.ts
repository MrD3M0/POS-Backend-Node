import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import { writeAudit } from "@/lib/audit";
import { parseBsDate } from "@/utils/bs-date";
import { FiscalYearCreateInput, FiscalYearUpdateInput } from "./validator";
import { dec, moneyEq, moneyStr } from "@/lib/money";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";

type TrialBalanceRow = { type: string; debit: string; credit: string };

const ACCOUNT_TYPE_ORDER = [
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "INCOME",
  "EXPENSE",
] as const;

type JournalLineSum = {
  journalEntryId: string;
  _sum: { debit: Prisma.Decimal | null; credit: Prisma.Decimal | null };
};

/**
 * A journal entry is balanced when debit == credit across all of its lines.
 * Grouping in the client keeps the check independent of how many entries a
 * fiscal year holds (the set is small and already bounded by the year).
 */
function unbalancedEntryCount(lines: JournalLineSum[]): number {
  const totals = new Map<string, { debit: Prisma.Decimal; credit: Prisma.Decimal }>();
  for (const line of lines) {
    const current = totals.get(line.journalEntryId) ?? {
      debit: dec(0),
      credit: dec(0),
    };
    current.debit = current.debit.plus(line._sum.debit ?? dec(0));
    current.credit = current.credit.plus(line._sum.credit ?? dec(0));
    totals.set(line.journalEntryId, current);
  }
  let unbalanced = 0;
  for (const { debit, credit } of totals.values()) {
    if (!moneyEq(debit, credit)) unbalanced += 1;
  }
  return unbalanced;
}

async function trialBalanceByType(
  db: PrismaClient,
  fiscalYearId: string,
): Promise<TrialBalanceRow[]> {
  const grouped = await db.journalLine.groupBy({
    by: ["accountId"],
    where: { journalEntry: { is: { fiscalYearId } } },
    _sum: { debit: true, credit: true },
  });
  if (grouped.length === 0) return [];

  const accountIds = grouped.map((row) => row.accountId);
  const accounts = await db.account.findMany({
    where: { id: { in: accountIds } },
    select: { id: true, type: true },
  });
  const typeByAccount = new Map(accounts.map((account) => [account.id, account.type]));

  const totals = new Map<string, { debit: Prisma.Decimal; credit: Prisma.Decimal }>();
  for (const row of grouped) {
    const type = typeByAccount.get(row.accountId);
    if (!type) continue;
    const current = totals.get(type) ?? { debit: dec(0), credit: dec(0) };
    current.debit = current.debit.plus(row._sum.debit ?? dec(0));
    current.credit = current.credit.plus(row._sum.credit ?? dec(0));
    totals.set(type, current);
  }

  return ACCOUNT_TYPE_ORDER.filter((type) => totals.has(type)).map((type) => {
    const value = totals.get(type)!;
    return {
      type,
      debit: moneyStr(value.debit),
      credit: moneyStr(value.credit),
    };
  });
}

function assertDateOrder(startDateBs: string, endDateBs: string) {
  if (startDateBs > endDateBs) {
    throw new CustomError("Fiscal year startDateBs must be on or before endDateBs", 400);
  }
}

function assertFiscalYearBounds(startDateBs: string, endDateBs: string) {
  const start = parseBsDate(startDateBs);
  const end = parseBsDate(endDateBs);
  if (!start || !end) throw new CustomError("Fiscal year dates must be valid BS dates", 400);
  if (start.month !== 4 || start.day !== 1) {
    throw new CustomError("Fiscal year must start on Shrawan 1 (YYYY-04-01 BS)", 400);
  }
  if (end.month !== 3) {
    throw new CustomError("Fiscal year must end in Asar (month 03) BS", 400);
  }
}

export const FiscalYearService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 50);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: Record<string, unknown> = { deletedAt: null };
    if (query.search) {
      whereClause.OR = [{ name: { contains: query.search, mode: "insensitive" } }];
    }

    const [years, total] = await Promise.all([
      prismaMain.fiscalYear.findMany({ where: whereClause, skip, take: toPrismaTake(limit), orderBy: { startDateBs: "desc" } }),
      prismaMain.fiscalYear.count({ where: whereClause }),
    ]);

    return { data: years, pagination: { page, limit, total } };
  },

  async create(data: FiscalYearCreateInput, userId?: string) {
    assertDateOrder(data.startDateBs, data.endDateBs);
    assertFiscalYearBounds(data.startDateBs, data.endDateBs);

    try {
      return await prismaMain.$transaction(async (tx) => {
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
        await writeAudit(tx, { entity: "FiscalYear", entityId: year.id, action: "CREATE", newValues: year, userId });
        return year;
      });
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === "P2002") {
        throw new CustomError("A fiscal year with this name already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const year = await prismaMain.fiscalYear.findFirst({ where: { id, deletedAt: null } });
    if (!year) throw new CustomError("Fiscal year not found", 404);
    return year;
  },

  async update(id: string, data: FiscalYearUpdateInput, userId?: string) {
    const existing = await prismaMain.fiscalYear.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new CustomError("Fiscal year not found", 404);
    if (existing.isClosed) throw new CustomError("A closed fiscal year cannot be edited", 409);

    const startDateBs = data.startDateBs ?? existing.startDateBs;
    const endDateBs = data.endDateBs ?? existing.endDateBs;
    assertDateOrder(startDateBs, endDateBs);
    if (data.startDateBs || data.endDateBs) assertFiscalYearBounds(startDateBs, endDateBs);

    try {
      return await prismaMain.$transaction(async (tx) => {
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
        await writeAudit(tx, { entity: "FiscalYear", entityId: id, action: "UPDATE", oldValues: existing, newValues: year, userId });
        return year;
      });
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === "P2002") {
        throw new CustomError("A fiscal year with this name already exists", 409);
      }
      throw error;
    }
  },

  async setCurrent(id: string, userId?: string) {
    return prismaMain.$transaction(async (tx) => {
      const year = await tx.fiscalYear.findFirst({ where: { id, deletedAt: null } });
      if (!year) throw new CustomError("Fiscal year not found", 404);
      if (year.isClosed) throw new CustomError("A closed fiscal year cannot be set as current", 409);

      await tx.fiscalYear.updateMany({
        where: { isCurrent: true, deletedAt: null, id: { not: id } },
        data: { isCurrent: false, updatedBy: userId },
      });
      const updated = await tx.fiscalYear.update({
        where: { id },
        data: { isCurrent: true, updatedBy: userId },
      });
      await writeAudit(tx, {
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

  async closePreview(id: string) {
    const year = await prismaMain.fiscalYear.findFirst({ where: { id, deletedAt: null } });
    if (!year) throw new CustomError("Fiscal year not found", 404);

    const [pendingPayrolls, lines] = await Promise.all([
      prismaMain.payroll.count({ where: { fiscalYearId: id, status: { in: ["DRAFT", "PENDING"] } } }),
      prismaMain.journalLine.groupBy({
        by: ["journalEntryId"],
        _sum: { debit: true, credit: true },
      }),
    ]);

    const unbalanced = unbalancedEntryCount(lines);

    const balances = await trialBalanceByType(prismaMain, id);

    const blockers: string[] = [];
    if (pendingPayrolls > 0) blockers.push(`${pendingPayrolls} payroll run(s) are still DRAFT/PENDING`);
    if (unbalanced > 0) blockers.push(`${unbalanced} journal entry(ies) are unbalanced`);

    return {
      fiscalYear: year,
      blockers,
      canClose: blockers.length === 0 && !year.isClosed,
      trialBalanceByType: balances,
      note:
        "Closing marks the fiscal year closed and blocks posting in that year. Automatic CLOSING journal entry generation is not performed by this action (review balances and post a CLOSING entry through the approved accounting workflow if required).",
    };
  },

  async close(id: string, reason: string, userId?: string) {
    if (!reason?.trim()) throw new CustomError("A reason is required to close a fiscal year", 400);

    return prismaMain.$transaction(async (tx) => {
      const year = await tx.fiscalYear.findFirst({ where: { id, deletedAt: null } });
      if (!year) throw new CustomError("Fiscal year not found", 404);
      if (year.isClosed) throw new CustomError("Fiscal year is already closed", 409);

      const pendingPayrolls = await tx.payroll.count({ where: { fiscalYearId: id, status: { in: ["DRAFT", "PENDING"] } } });
      if (pendingPayrolls > 0) throw new CustomError(`Cannot close: ${pendingPayrolls} payroll run(s) are still DRAFT/PENDING`, 409);

      const unbalancedLines = await tx.journalLine.groupBy({
        by: ["journalEntryId"],
        _sum: { debit: true, credit: true },
      });
      const unbalanced = unbalancedEntryCount(unbalancedLines);
      if (unbalanced > 0) throw new CustomError("Cannot close: trial balance has unbalanced journal entries", 409);

      const closed = await tx.fiscalYear.update({
        where: { id },
        data: { isClosed: true, isCurrent: false, updatedBy: userId },
      });
      await writeAudit(tx, {
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

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.fiscalYear.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { journalEntries: true, payments: true, payrolls: true } } },
    });
    if (!existing) throw new CustomError("Fiscal year not found", 404);
    if (existing.isCurrent) throw new CustomError("The current fiscal year cannot be deleted", 409);
    if (existing._count.journalEntries > 0 || existing._count.payments > 0 || existing._count.payrolls > 0) {
      throw new CustomError("Fiscal year has financial postings and cannot be deleted; close it instead", 409);
    }

    await prismaMain.fiscalYear.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: userId } });
    return null;
  },
};
