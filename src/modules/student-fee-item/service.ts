import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { StudentFeeItemCreateInput } from "./validator";

export const StudentFeeItemService = {
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
        { dueDateBs: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prismaMain.studentFeeItem.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.studentFeeItem.count({ where: whereClause }),
    ]);

    return {
      data: items,
      pagination: { page, limit, total },
    };
  },

  async create(data: StudentFeeItemCreateInput, userId?: string) {
    try {
      const item = await prismaMain.studentFeeItem.create({
        data: {
          ...data,
          studentFeeId: data.studentFeeId,
          createdBy: userId,
        },
      });
      return item;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A student fee item already exists for this fee and term", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const item = await prismaMain.studentFeeItem.findFirst({
      where: { id, deletedAt: null },
    });

    if (!item) {
      throw new CustomError("Student fee item not found", 404);
    }

    return item;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.studentFeeItem.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Student fee item not found", 404);
    }

    await prismaMain.studentFeeItem.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
