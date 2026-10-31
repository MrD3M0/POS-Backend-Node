import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { FeeHeadCreateInput } from "./validator";

export const FeeHeadService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { code: { contains: query.search, mode: "insensitive" } },
        { name: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prismaMain.feeHead.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.feeHead.count({ where: whereClause }),
    ]);

    return {
      data: items,
      pagination: { page, limit, total },
    };
  },

  async create(data: FeeHeadCreateInput, userId?: string) {
    try {
      const head = await prismaMain.feeHead.create({
        data: {
          ...data,
          createdBy: userId,
        },
      });
      return head;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A fee head with this code already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const head = await prismaMain.feeHead.findFirst({
      where: { id, deletedAt: null },
    });

    if (!head) {
      throw new CustomError("Fee head not found", 404);
    }

    return head;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.feeHead.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Fee head not found", 404);
    }

    await prismaMain.feeHead.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
