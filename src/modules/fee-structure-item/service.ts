import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { FeeStructureItemCreateInput } from "./validator";

export const FeeStructureItemService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { feeHeadId: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prismaMain.feeStructureItem.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          feeHead: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.feeStructureItem.count({ where: whereClause }),
    ]);

    return {
      data: items,
      pagination: { page, limit, total },
    };
  },

  async create(data: FeeStructureItemCreateInput, userId?: string) {
    // Validate parent fee structure exists and not soft-deleted
    const [structure] = await Promise.all([
      prismaMain.feeStructure.findFirst({ where: { id: data.feeStructureId, deletedAt: null } }),
    ]);
    if (!structure) {
      throw new CustomError("Fee structure not found", 404);
    }

    try {
      const item = await prismaMain.feeStructureItem.create({
        data: {
          ...data,
          feeStructureId: data.feeStructureId,
          createdBy: userId,
        },
        include: {
          feeHead: true,
        },
      });
      return item;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A fee structure item for this head and term already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const item = await prismaMain.feeStructureItem.findFirst({
      where: { id, deletedAt: null },
      include: {
        feeHead: true,
      },
    });

    if (!item) {
      throw new CustomError("Fee structure item not found", 404);
    }

    return item;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.feeStructureItem.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Fee structure item not found", 404);
    }

    await prismaMain.feeStructureItem.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
