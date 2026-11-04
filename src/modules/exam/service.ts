import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { ExamCreateInput } from "./validator";

export const ExamService = {
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

    const [exams, total] = await Promise.all([
      prismaMain.exam.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          subjects: true,
          examMarks: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.exam.count({ where: whereClause }),
    ]);

    return {
      data: exams,
      pagination: { page, limit, total },
    };
  },

  async create(data: ExamCreateInput, userId?: string) {
    try {
      const exam = await prismaMain.exam.create({
        data: {
          ...data,
          ...(userId && { createdBy: userId }),
        },
        include: {
          subjects: true,
          examMarks: true,
        } as any,
      });
      return exam;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("An exam with these dates already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const exam = await prismaMain.exam.findFirst({
      where: { id, deletedAt: null },
      include: {
        subjects: true,
        examMarks: true,
      },
    });

    if (!exam) {
      throw new CustomError("Exam not found", 404);
    }

    return exam;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.exam.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Exam not found", 404);
    }

    await prismaMain.exam.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
