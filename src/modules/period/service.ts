import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { PeriodCreateInput, PeriodUpdateInput } from "./validator";

export const PeriodService = {
  async index(query: { page?: number; limit?: number; search?: string; isActive?: boolean }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

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
        take: limit,
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
    // Check duplicate period number within same name
    const existing = await prismaMain.period.findFirst({
      where: {
        name: data.name,
        deletedAt: null,
      },
    });

    if (existing && existing.periodNumber === data.periodNumber) {
      throw new CustomError("A period with this name already exists", 409);
    }

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
        throw new CustomError("A period with this name already exists", 409);
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

    const targetName = data.name !== undefined ? data.name : existing.name;
    const targetPeriodNumber = data.periodNumber !== undefined ? data.periodNumber : existing.periodNumber;

    if (targetPeriodNumber !== existing.periodNumber) {
      const duplicate = await prismaMain.period.findFirst({
        where: {
          name: targetName,
          NOT: { id },
          deletedAt: null,
        },
      });

      if (duplicate) {
        throw new CustomError("A period with this name already exists", 409);
      }
    }

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
        throw new CustomError("A period with this name already exists", 409);
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
