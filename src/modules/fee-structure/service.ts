import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { FeeStructureCreateInput } from "./validator";

export const FeeStructureService = {
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

    const [structures, total] = await Promise.all([
      prismaMain.feeStructure.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          items: true,
          installments: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.feeStructure.count({ where: whereClause }),
    ]);

    return {
      data: structures,
      pagination: { page, limit, total },
    };
  },

  async create(data: FeeStructureCreateInput, userId?: string) {
    try {
      const structure = await prismaMain.feeStructure.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          items: true,
          installments: true,
        },
      });
      return structure;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A fee structure with this name already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const structure = await prismaMain.feeStructure.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: true,
        installments: true,
      },
    });

    if (!structure) {
      throw new CustomError("Fee structure not found", 404);
    }

    return structure;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.feeStructure.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Fee structure not found", 404);
    }

    await prismaMain.feeStructure.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
