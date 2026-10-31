import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { TaxSlabCreateInput, TaxSlabUpdateInput } from "./validator";

export const TaxSlabService = {
  async index(query: { page?: number; limit?: number; search?: string; fiscalYearId?: string; isCouple?: boolean }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (query.search) {
      whereClause.OR = [
        { fromAmount: { contains: query.search, mode: "insensitive" } },
        { toAmount: { contains: query.search, mode: "insensitive" } },
        { ratePercent: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.fiscalYearId) {
      whereClause.fiscalYearId = query.fiscalYearId;
    }

    if (query.isCouple !== undefined) {
      whereClause.isCouple = query.isCouple;
    }

    const [taxSlabs, total] = await Promise.all([
      prismaMain.taxSlab.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          fiscalYear: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.taxSlab.count({ where: whereClause }),
    ]);

    return {
      taxSlabs,
      pagination: {
        page,
        limit,
        total,
      },
    };
  },

  async create(data: TaxSlabCreateInput, userId?: string) {
    // Validate fiscal year exists
    const fiscalYear = await prismaMain.fiscalYear.findFirst({
      where: { id: data.fiscalYearId, deletedAt: null },
    });

    if (!fiscalYear) {
      throw new CustomError("Fiscal year not found or has been deleted", 404);
    }

    try {
      const taxSlab = await prismaMain.taxSlab.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          fiscalYear: true,
        },
      });
      return taxSlab;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A tax slab already exists for this fiscal year", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const taxSlab = await prismaMain.taxSlab.findFirst({
      where: { id, deletedAt: null },
      include: {
        fiscalYear: true,
      },
    });

    if (!taxSlab) {
      throw new CustomError("Tax slab not found", 404);
    }

    return taxSlab;
  },

  async update(id: string, data: TaxSlabUpdateInput, userId?: string) {
    const existing = await prismaMain.taxSlab.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Tax slab not found", 404);
    }

    try {
      const updated = await prismaMain.taxSlab.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        },
        include: {
          fiscalYear: true,
        },
      });
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A tax slab already exists for this fiscal year", 409);
      }
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.taxSlab.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Tax slab not found", 404);
    }

    await prismaMain.taxSlab.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
