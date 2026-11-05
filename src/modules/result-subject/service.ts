import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { ResultSubjectCreateInput, ResultSubjectUpdateInput } from "./validator";

export const ResultSubjectService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (query.search) {
      whereClause.OR = [
        { examSubject: { name: { contains: query.search, mode: "insensitive" } } },
        { result: { remarks: { contains: query.search, mode: "insensitive" } } },
      ];
    }

    const [resultSubjects, total] = await Promise.all([
      prismaMain.resultSubject.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          examSubject: true,
          gradeScale: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.resultSubject.count({ where: whereClause }),
    ]);

    return {
      resultSubjects,
      pagination: {
        page,
        limit,
        total,
      },
    };
  },

  async create(data: ResultSubjectCreateInput, userId?: string) {
    // Validate exam subject exists
    const examSubject = await prismaMain.examSubject.findFirst({
      where: { id: data.examSubjectId, deletedAt: null },
    });

    if (!examSubject) {
      throw new CustomError("Exam subject not found or has been deleted", 404);
    }

    // Validate result exists
    const result = await prismaMain.result.findFirst({
      where: { id: data.resultId, deletedAt: null },
    });

    if (!result) {
      throw new CustomError("Result not found or has been deleted", 404);
    }

    // Validate grade scale exists
    const gradeScale = await prismaMain.gradeScale.findFirst({
      where: { id: data.gradeScaleId, deletedAt: null },
    });

    if (!gradeScale) {
      throw new CustomError("Grade scale not found or inactive", 404);
    }

    try {
      const resultSubject = await prismaMain.resultSubject.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          examSubject: true,
          gradeScale: true,
        },
      });
      return resultSubject;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A result subject already exists for this exam subject", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const resultSubject = await prismaMain.resultSubject.findFirst({
      where: { id, deletedAt: null },
      include: {
        examSubject: true,
        gradeScale: true,
      },
    });

    if (!resultSubject) {
      throw new CustomError("Result subject not found", 404);
    }

    return resultSubject;
  },

  async update(id: string, data: ResultSubjectUpdateInput, userId?: string) {
    const existing = await prismaMain.resultSubject.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Result subject not found", 404);
    }

    try {
      const updated = await prismaMain.resultSubject.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        },
        include: {
          examSubject: true,
          gradeScale: true,
        },
      });
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A result subject already exists for this exam subject", 409);
      }
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.resultSubject.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Result subject not found", 404);
    }

    await prismaMain.resultSubject.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
