import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import { writeAudit } from "@/lib/audit";
import { GradeScaleItemCreateInput, GradeScaleItemUpdateInput } from "./validator";

const DEC = (value: string | number) => Number(value);

function validateRange(min: number, max: number) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) throw new CustomError("minPercent and maxPercent must be numbers", 400);
  if (min < 0 || max > 100) throw new CustomError("Percent range must stay within 0-100", 400);
  if (max <= min) throw new CustomError("maxPercent must be greater than minPercent", 400);
}

async function assertNoOverlap(min: number, max: number, excludeId?: string) {
  const rows = await prismaMain.gradeScale.findMany({
    where: { deletedAt: null, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { id: true, grade: true, minPercent: true, maxPercent: true },
  });
  for (const row of rows) {
    const otherMin = DEC(row.minPercent.toString());
    const otherMax = DEC(row.maxPercent.toString());
    // Half-open adjacency [min,max) is allowed except the final 100 row; overlap when ranges intersect.
    if (min < otherMax && max > otherMin) {
      throw new CustomError(
        `Range ${min}-${max} overlaps ${row.grade} (${otherMin}-${otherMax})`,
        409,
      );
    }
  }
}

function analyzeCoverage(rows: { grade: string; minPercent: unknown; maxPercent: unknown }[]) {
  const ranges = rows
    .map((row) => ({
      grade: row.grade,
      min: DEC(String(row.minPercent)),
      max: DEC(String(row.maxPercent)),
    }))
    .sort((a, b) => a.min - b.min || a.max - b.max);

  if (ranges.length === 0) {
    return { ok: false, issues: ["No grade scale rows configured"], ranges };
  }

  const issues: string[] = [];
  if (ranges[0].min !== 0) issues.push(`Coverage starts at ${ranges[0].min}, not 0`);
  if (ranges[ranges.length - 1].max !== 100) issues.push(`Coverage ends at ${ranges[ranges.length - 1].max}, not 100`);
  for (let i = 1; i < ranges.length; i += 1) {
    const prev = ranges[i - 1];
    const curr = ranges[i];
    if (curr.min < prev.max) issues.push(`Overlap between ${prev.grade} and ${curr.grade}`);
    if (curr.min > prev.max) issues.push(`Gap between ${prev.grade} (${prev.max}) and ${curr.grade} (${curr.min})`);
  }
  return { ok: issues.length === 0, issues, ranges };
}

export const GradeScaleService = {
  async index(query: { page?: number; limit?: number; search?: string; includeDeleted?: boolean }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 50, 200);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: Record<string, unknown> = query.includeDeleted ? {} : { deletedAt: null };
    if (query.search) {
      whereClause.OR = [
        { grade: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prismaMain.gradeScale.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        orderBy: { minPercent: "desc" },
      }),
      prismaMain.gradeScale.count({ where: whereClause }),
    ]);

    return { data: items, pagination: { page, limit, total } };
  },

  async create(data: GradeScaleItemCreateInput, userId?: string) {
    const min = DEC(data.minPercent);
    const max = DEC(data.maxPercent);
    validateRange(min, max);
    await assertNoOverlap(min, max);

    try {
      return await prismaMain.$transaction(async (tx) => {
        const item = await tx.gradeScale.create({ data: { ...data, createdBy: userId } });
        await writeAudit(tx, {
          entity: "GradeScale",
          entityId: item.id,
          action: "CREATE",
          newValues: item,
          userId,
        });
        return item;
      });
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === "P2002") {
        throw new CustomError("A grade scale item with this grade already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const item = await prismaMain.gradeScale.findFirst({ where: { id, deletedAt: null } });
    if (!item) throw new CustomError("Grade scale item not found", 404);
    return item;
  },

  async update(id: string, data: GradeScaleItemUpdateInput, userId?: string) {
    const existing = await prismaMain.gradeScale.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new CustomError("Grade scale item not found", 404);

    const min = DEC(data.minPercent ?? existing.minPercent.toString());
    const max = DEC(data.maxPercent ?? existing.maxPercent.toString());
    validateRange(min, max);
    await assertNoOverlap(min, max, id);

    // Warn (but do not block) when pending results exist; submitted results keep snapshots.
    const pendingResults = await prismaMain.result.count({ where: { status: "PENDING", deletedAt: null } });

    try {
      return await prismaMain.$transaction(async (tx) => {
        const item = await tx.gradeScale.update({ where: { id }, data: { ...data, updatedBy: userId } });
        await writeAudit(tx, {
          entity: "GradeScale",
          entityId: id,
          action: "UPDATE",
          oldValues: existing,
          newValues: { ...item, pendingResultsAtChange: pendingResults },
          userId,
        });
        return { ...item, pendingResultsAtChange: pendingResults };
      });
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === "P2002") {
        throw new CustomError("A grade scale item with this grade already exists", 409);
      }
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.gradeScale.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { resultSubjects: true } } },
    });
    if (!existing) throw new CustomError("Grade scale item not found", 404);
    if (existing._count.resultSubjects > 0) {
      throw new CustomError(
        `Used by ${existing._count.resultSubjects} result subjects; deactivate instead`,
        409,
      );
    }

    await prismaMain.$transaction(async (tx) => {
      await tx.gradeScale.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: userId } });
      await writeAudit(tx, { entity: "GradeScale", entityId: id, action: "DELETE", oldValues: existing, userId });
    });
    return null;
  },

  async coverage() {
    const rows = await prismaMain.gradeScale.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, grade: true, minPercent: true, maxPercent: true, isPassGrade: true },
      orderBy: { minPercent: "asc" },
    });
    return analyzeCoverage(rows);
  },

  async seedDefault(userId?: string) {
    const defaults = [
      { grade: "A", minPercent: "90", maxPercent: "100", gradePoint: "4.0", description: "Outstanding", isPassGrade: true },
      { grade: "A-", minPercent: "80", maxPercent: "90", gradePoint: "3.7", description: "Excellent", isPassGrade: true },
      { grade: "B+", minPercent: "70", maxPercent: "80", gradePoint: "3.3", description: "Very good", isPassGrade: true },
      { grade: "B", minPercent: "60", maxPercent: "70", gradePoint: "3.0", description: "Good", isPassGrade: true },
      { grade: "B-", minPercent: "50", maxPercent: "60", gradePoint: "2.7", description: "Satisfactory", isPassGrade: true },
      { grade: "C", minPercent: "40", maxPercent: "50", gradePoint: "2.0", description: "Pass", isPassGrade: true },
      { grade: "F", minPercent: "0", maxPercent: "40", gradePoint: "0.0", description: "Fail", isPassGrade: false },
    ];

    return prismaMain.$transaction(async (tx) => {
      let created = 0;
      let skipped = 0;
      for (const row of defaults) {
        const exists = await tx.gradeScale.findFirst({ where: { grade: row.grade, deletedAt: null } });
        if (exists) {
          skipped += 1;
          continue;
        }
        await tx.gradeScale.create({ data: { ...row, isActive: true, createdBy: userId } });
        created += 1;
      }
      await writeAudit(tx, {
        entity: "GradeScale",
        action: "SEED_DEFAULT",
        newValues: { created, skipped },
        userId,
      });
      return { created, skipped, total: defaults.length };
    });
  },
};
