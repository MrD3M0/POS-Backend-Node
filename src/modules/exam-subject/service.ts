import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import { ExamSubjectCreateInput, ExamSubjectUpdateInput } from "./validator";

const EXAM_SUBJECT_INCLUDE = {
  exam: true,
  batchTermSubject: {
    include: {
      subject: true,
      batchTerm: { include: { batch: true } },
      assignments: {
        where: { deletedAt: null },
        include: {
          teacher: {
            include: {
              employee: {
                select: {
                  id: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  employeeCode: true,
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

export const ExamSubjectService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { examId: { contains: query.search, mode: "insensitive" } },
        { fullMarks: { contains: query.search, mode: "insensitive" } },
        { passMarks: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prismaMain.examSubject.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: EXAM_SUBJECT_INCLUDE,
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.examSubject.count({ where: whereClause }),
    ]);

    return {
      data: items,
      pagination: { page, limit, total },
    };
  },

  async create(data: ExamSubjectCreateInput, userId?: string) {
    try {
      const item = await prismaMain.examSubject.create({
        data: {
          ...data,
          ...(userId && { createdBy: userId }),
        } as any,
        include: EXAM_SUBJECT_INCLUDE,
      });
      return item;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError(
          "An exam subject with this exam already exists",
          409,
        );
      }
      throw error;
    }
  },

  async getById(id: string) {
    const item = await prismaMain.examSubject.findFirst({
      where: { id, deletedAt: null },
      include: EXAM_SUBJECT_INCLUDE,
    });

    if (!item) {
      throw new CustomError("Exam subject not found", 404);
    }

    return item;
  },

  async update(id: string, data: ExamSubjectUpdateInput, userId?: string) {
    const existing = await prismaMain.examSubject.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Exam subject not found", 404);
    }

    try {
      const updated = await prismaMain.examSubject.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        } as any,
        include: EXAM_SUBJECT_INCLUDE,
      });
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError(
          "An exam subject with this exam already exists",
          409,
        );
      }
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.examSubject.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Exam subject not found", 404);
    }

    await prismaMain.examSubject.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
