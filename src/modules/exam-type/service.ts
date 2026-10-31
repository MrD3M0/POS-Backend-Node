import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { ExamTypeCreateInput } from "./validator";

export const ExamTypeService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (query.search) {
      whereClause.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [examTypes, total] = await Promise.all([
      prismaMain.examType.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.examType.count({ where: whereClause }),
    ]);

    return {
      data: examTypes,
      pagination: { page, limit, total },
    };
  },

  async create(data: ExamTypeCreateInput, userId?: string) {
    try {
      const examType = await prismaMain.examType.create({
        data: {
          ...data,
          createdBy: userId,
        },
      });
      return examType;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("An exam type with this name already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const examType = await prismaMain.examType.findFirst({
      where: { id, deletedAt: null },
    });

    if (!examType) {
      throw new CustomError("Exam type not found", 404);
    }

    return examType;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.examType.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Exam type not found", 404);
    }

    await prismaMain.examType.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
