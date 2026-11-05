import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { GradeScaleItemCreateInput } from "./validator";

export const GradeScaleService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

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
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.gradeScale.count({ where: whereClause }),
    ]);

    return {
      data: items,
      pagination: { page, limit, total },
    };
  },

  async create(data: GradeScaleItemCreateInput, userId?: string) {
    try {
      const item = await prismaMain.gradeScale.create({
        data: {
          ...data,
          createdBy: userId,
        },
      });
      return item;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A grade scale item with this grade already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const item = await prismaMain.gradeScale.findFirst({
      where: { id, deletedAt: null },
    });

    if (!item) {
      throw new CustomError("Grade scale item not found", 404);
    }

    return item;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.gradeScale.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Grade scale item not found", 404);
    }

    await prismaMain.gradeScale.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
