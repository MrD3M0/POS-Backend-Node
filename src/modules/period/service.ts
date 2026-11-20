import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import { PeriodCreateInput, PeriodUpdateInput } from "./validator";

// HH:mm strings compare chronologically. Periods are half-open [start, end):
// overlap iff newStart < existingEnd AND existingStart < newEnd.
async function assertNoOverlap(startTime: string, endTime: string, excludeId?: string) {
  const existing = await prismaMain.period.findMany({
    where: { deletedAt: null, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { id: true, periodNumber: true, name: true, startTime: true, endTime: true },
  });
  for (const e of existing) {
    if (startTime < e.endTime && e.startTime < endTime) {
      throw new CustomError(
        `Period ${startTime}-${endTime} overlaps period ${e.periodNumber} (${e.name}) ${e.startTime}-${e.endTime}`,
        409,
      );
    }
  }
}

export const PeriodService = {
  async index(query: { page?: number; limit?: number; search?: string; isActive?: boolean }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.isActive !== undefined) {
      whereClause.isActive = query.isActive;
    }

    const [periods, total] = await Promise.all([
      prismaMain.period.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: {
          sessions: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.period.count({ where: whereClause }),
    ]);

    return {
      periods,
      pagination: {
        page,
        limit,
        total,
      },
    };
  },

  async create(data: PeriodCreateInput, userId?: string) {
    if (data.endTime <= data.startTime) {
      throw new CustomError("endTime must be after startTime", 400);
    }
    // periodNumber is @unique (schema).
    const existing = await prismaMain.period.findFirst({
      where: {
        periodNumber: data.periodNumber,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new CustomError("A period with this period number already exists", 409);
    }
    await assertNoOverlap(data.startTime, data.endTime);

    try {
      const period = await prismaMain.period.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          sessions: true,
        },
      });
      return period;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A period with this period number already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const period = await prismaMain.period.findFirst({
      where: { id, deletedAt: null },
      include: {
        sessions: true,
      },
    });

    if (!period) {
      throw new CustomError("Period not found", 404);
    }

    return period;
  },

  async update(id: string, data: PeriodUpdateInput, userId?: string) {
    const existing = await prismaMain.period.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Period not found", 404);
    }

    const targetPeriodNumber = data.periodNumber !== undefined ? data.periodNumber : existing.periodNumber;
    const targetStart = data.startTime !== undefined ? data.startTime : existing.startTime;
    const targetEnd = data.endTime !== undefined ? data.endTime : existing.endTime;

    if (targetEnd <= targetStart) {
      throw new CustomError("endTime must be after startTime", 400);
    }

    if (targetPeriodNumber !== existing.periodNumber) {
      const duplicate = await prismaMain.period.findFirst({
        where: {
          periodNumber: targetPeriodNumber,
          NOT: { id },
          deletedAt: null,
        },
      });

      if (duplicate) {
        throw new CustomError("A period with this period number already exists", 409);
      }
    }
    await assertNoOverlap(targetStart, targetEnd, id);

    try {
      const updated = await prismaMain.period.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        },
        include: {
          sessions: true,
        },
      });
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A period with this period number already exists", 409);
      }
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.period.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Period not found", 404);
    }

    await prismaMain.period.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
