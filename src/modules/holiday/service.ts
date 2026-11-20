import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import { writeAudit } from "@/lib/audit";
import { isSaturdayBs, listBsDatesInMonth } from "@/utils/bs-date";
import { HolidayBulkCreateInput, HolidayBulkInput, HolidayCreateInput, HolidayUpdateInput } from "./validator";

/**
 * Set of active holiday dates that apply to students, optionally limited to a
 * BS date range. Attendance percentages consult this so that sessions held on
 * holidays are not counted as working days. Degrades to an empty set on DB
 * errors, mirroring the graceful degradation of HolidayService.index.
 */
export async function studentHolidayDateBs(
  range?: { fromBs?: string; toBs?: string },
): Promise<Set<string>> {
  try {
    const rows = await prismaMain.holiday.findMany({
      where: {
        deletedAt: null,
        appliesToStudents: true,
        ...(range?.fromBs || range?.toBs
          ? {
              dateBs: {
                ...(range.fromBs ? { gte: range.fromBs } : {}),
                ...(range.toBs ? { lte: range.toBs } : {}),
              },
            }
          : {}),
      },
      select: { dateBs: true },
    });
    return new Set(rows.map((row) => row.dateBs));
  } catch {
    return new Set();
  }
}

const SELECT = {
  id: true,
  dateBs: true,
  name: true,
  type: true,
  description: true,
  appliesToEmployees: true,
  appliesToStudents: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

export const HolidayService = {
  async index(query: {
    page?: number;
    limit?: number;
    search?: string;
    yearBs?: number;
    monthBs?: number;
    appliesToStudents?: boolean;
    appliesToEmployees?: boolean;
    includeDeleted?: boolean;
    sort?: "dateBs" | "name" | "createdAt";
    order?: "asc" | "desc";
  }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10, 500);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const where: Record<string, unknown> = query.includeDeleted ? {} : { deletedAt: null };
    if (query.search) where.name = { contains: query.search, mode: "insensitive" };
    if (query.yearBs && query.monthBs) {
      const prefix = `${query.yearBs}-${String(query.monthBs).padStart(2, "0")}`;
      where.dateBs = { startsWith: prefix };
    } else if (query.yearBs) {
      where.dateBs = { startsWith: String(query.yearBs) };
    }
    if (query.appliesToStudents !== undefined) where.appliesToStudents = query.appliesToStudents;
    if (query.appliesToEmployees !== undefined) where.appliesToEmployees = query.appliesToEmployees;

    const orderBy = {
      [query.sort ?? "dateBs"]: query.order ?? "asc",
    } as Record<string, "asc" | "desc">;

    try {
      const [holidays, total] = await Promise.all([
        prismaMain.holiday.findMany({ where, skip, take: toPrismaTake(limit), select: SELECT, orderBy }),
        prismaMain.holiday.count({ where }),
      ]);
      return { data: holidays, pagination: { page, limit, total } };
    } catch {
      // Dev DB schema drift/missing table: degrade gracefully.
      return { data: [], pagination: { page, limit, total: 0 } };
    }
  },

  async getById(id: string) {
    const holiday = await prismaMain.holiday.findFirst({ where: { id, deletedAt: null }, select: SELECT });
    if (!holiday) throw new CustomError("Holiday not found", 404);
    return holiday;
  },

  async getByDate(dateBs: string) {
    try {
      return await prismaMain.holiday.findFirst({
        where: { dateBs, deletedAt: null },
        select: SELECT,
      });
    } catch {
      return null;
    }
  },

  async create(data: HolidayCreateInput, userId?: string) {
    const duplicate = await prismaMain.holiday.findFirst({ where: { dateBs: data.dateBs } });
    if (duplicate) {
      if (duplicate.deletedAt) {
        throw new CustomError(
          `A deleted holiday already exists for ${data.dateBs}; restore it instead`,
          409,
        );
      }
      throw new CustomError(`A holiday already exists for ${data.dateBs}`, 409);
    }

    return prismaMain.$transaction(async (tx) => {
      const holiday = await tx.holiday.create({ data: { ...data, createdBy: userId }, select: SELECT });
      await writeAudit(tx, {
        entity: "Holiday",
        entityId: holiday.id,
        action: "CREATE",
        newValues: holiday,
        userId,
      });
      return holiday;
    });
  },

  async update(id: string, data: HolidayUpdateInput, userId?: string) {
    const existing = await prismaMain.holiday.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new CustomError("Holiday not found", 404);

    if (data.dateBs && data.dateBs !== existing.dateBs) {
      const duplicate = await prismaMain.holiday.findFirst({ where: { dateBs: data.dateBs, NOT: { id } } });
      if (duplicate) throw new CustomError(`A holiday already exists for ${data.dateBs}`, 409);
    }

    return prismaMain.$transaction(async (tx) => {
      const holiday = await tx.holiday.update({
        where: { id },
        data: { ...data, updatedBy: userId },
        select: SELECT,
      });
      await writeAudit(tx, {
        entity: "Holiday",
        entityId: id,
        action: "UPDATE",
        oldValues: existing,
        newValues: holiday,
        userId,
      });
      return holiday;
    });
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.holiday.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new CustomError("Holiday not found", 404);

    await prismaMain.$transaction(async (tx) => {
      await tx.holiday.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: userId } });
      await writeAudit(tx, {
        entity: "Holiday",
        entityId: id,
        action: "DELETE",
        oldValues: existing,
        userId,
      });
    });
    return null;
  },

  async restore(id: string, userId?: string) {
    const existing = await prismaMain.holiday.findUnique({ where: { id } });
    if (!existing) throw new CustomError("Holiday not found", 404);
    if (!existing.deletedAt) throw new CustomError("Holiday is not deleted", 409);

    const active = await prismaMain.holiday.findFirst({ where: { dateBs: existing.dateBs, deletedAt: null } });
    if (active) throw new CustomError(`A holiday already exists for ${existing.dateBs}`, 409);

    return prismaMain.$transaction(async (tx) => {
      const holiday = await tx.holiday.update({
        where: { id },
        data: { deletedAt: null, updatedBy: userId },
        select: SELECT,
      });
      await writeAudit(tx, {
        entity: "Holiday",
        entityId: id,
        action: "RESTORE",
        newValues: holiday,
        userId,
      });
      return holiday;
    });
  },

  /** CSV-style bulk import; duplicate dates are reported per row, never silently skipped. */
  async bulkImport(data: HolidayBulkInput, userId?: string) {    const results: { index: number; dateBs: string; success: boolean; error?: string }[] = [];

    for (let index = 0; index < data.holidays.length; index += 1) {
      const row = data.holidays[index] as HolidayCreateInput;
      try {
        await this.create(row, userId);
        results.push({ index, dateBs: row.dateBs, success: true });
      } catch (error) {
        results.push({
          index,
          dateBs: row.dateBs,
          success: false,
          error: error instanceof Error ? error.message : "Failed to import",
        });
      }
    }

    return {
      imported: results.filter((row) => row.success).length,
      failed: results.filter((row) => !row.success).length,
      results,
    };
  },

  /**
   * Creates one holiday per date sharing the same name/type/description in a
   * SINGLE transaction. Dates that already have a holiday row (active or
   * soft-deleted — dateBs is globally unique) are skipped, never fatal.
   */
  async bulkCreate(data: HolidayBulkCreateInput, userId?: string) {
    const dates = [...new Set(data.dates)];

    const existing = await prismaMain.holiday.findMany({
      where: { dateBs: { in: dates } },
      select: { dateBs: true },
    });
    const taken = new Set(existing.map((row) => row.dateBs));
    const toCreate = dates.filter((dateBs) => !taken.has(dateBs));
    const skippedDates = dates.filter((dateBs) => taken.has(dateBs));

    if (toCreate.length > 0) {
      await prismaMain.$transaction(async (tx) => {
        await tx.holiday.createMany({
          data: toCreate.map((dateBs) => ({
            dateBs,
            name: data.name,
            type: data.type,
            description: data.description ?? null,
            appliesToEmployees: data.appliesToEmployees,
            appliesToStudents: data.appliesToStudents,
            createdBy: userId ?? null,
          })),
        });
        await writeAudit(tx, {
          entity: "Holiday",
          action: "BULK_CREATE",
          newValues: {
            name: data.name,
            type: data.type,
            requested: dates.length,
            created: toCreate.length,
            skipped: skippedDates.length,
            dates: toCreate,
          },
          userId,
        });
      });
    }

    return {
      requested: dates.length,
      created: toCreate.length,
      skipped: skippedDates.length,
      skippedDates,
    };
  },

  /** Creates a holiday for every Saturday of a BS year (idempotent). */
  async generateWeeklyOffs(input: { yearBs: number; name: string }, userId?: string) {
    const dates: string[] = [];
    for (let month = 1; month <= 12; month += 1) {
      for (const dateBs of listBsDatesInMonth(input.yearBs, month)) {
        if (isSaturdayBs(dateBs)) dates.push(dateBs);
      }
    }

    const existing = await prismaMain.holiday.findMany({
      where: { dateBs: { in: dates } },
      select: { dateBs: true },
    });
    const taken = new Set(existing.map((row) => row.dateBs));
    const toCreate = dates.filter((dateBs) => !taken.has(dateBs));

    if (toCreate.length > 0) {
      await prismaMain.$transaction(async (tx) => {
        await tx.holiday.createMany({
          data: toCreate.map((dateBs) => ({
            dateBs,
            name: input.name,
            appliesToEmployees: true,
            appliesToStudents: true,
            createdBy: userId ?? null,
          })),
        });
        await writeAudit(tx, {
          entity: "Holiday",
          action: "WEEKLY_OFF_GENERATE",
          newValues: { yearBs: input.yearBs, created: toCreate.length, skipped: dates.length - toCreate.length },
          userId,
        });
      });
    }

    return {
      yearBs: input.yearBs,
      totalSaturdays: dates.length,
      created: toCreate.length,
      skippedExisting: dates.length - toCreate.length,
    };
  },
};
