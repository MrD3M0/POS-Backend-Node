import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { FiscalYearCreateInput } from "./validator";

export const FiscalYearService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
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

    const [years, total] = await Promise.all([
      prismaMain.fiscalYear.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          periods: true,
          batches: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.fiscalYear.count({ where: whereClause }),
    ]);

    return {
      data: years,
      pagination: { page, limit, total },
    };
  },

  async create(data: FiscalYearCreateInput, userId?: string) {
    try {
      const year = await prismaMain.fiscalYear.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          periods: true,
          batches: true,
        },
      });
      return year;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A fiscal year with this name already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const year = await prismaMain.fiscalYear.findFirst({
      where: { id, deletedAt: null },
      include: {
        periods: true,
        batches: true,
      },
    });

    if (!year) {
      throw new CustomError("Fiscal year not found", 404);
    }

    return year;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.fiscalYear.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Fiscal year not found", 404);
    }

    await prismaMain.fiscalYear.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
