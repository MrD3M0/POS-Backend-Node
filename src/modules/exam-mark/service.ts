import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { ExamMarkCreateInput } from "./validator";

export const ExamMarkService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { studentId: { contains: query.search, mode: "insensitive" } },
        { examSubjectId: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [marks, total] = await Promise.all([
      prismaMain.examMark.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          student: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.examMark.count({ where: whereClause }),
    ]);

    return {
      data: marks,
      pagination: { page, limit, total },
    };
  },

  async create(data: ExamMarkCreateInput, userId?: string) {
    // Validate exam and exam subject exist
    const [exam] = await Promise.all([
      prismaMain.exam.findFirst({ where: { id: data.examId, deletedAt: null } }),
    ]);
    if (!exam) {
      throw new CustomError("Exam not found", 404);
    }

    try {
      const mark = await prismaMain.examMark.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          student: true,
        },
      });
      return mark;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("An exam mark already exists for this student and subject", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const mark = await prismaMain.examMark.findFirst({
      where: { id, deletedAt: null },
      include: {
        student: true,
      },
    });

    if (!mark) {
      throw new CustomError("Exam mark not found", 404);
    }

    return mark;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.examMark.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Exam mark not found", 404);
    }

    await prismaMain.examMark.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
