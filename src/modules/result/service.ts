import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { ResultCreateInput, ResultUpdateInput } from "./validator";

export const ResultService = {
  async index(query: { page?: number; limit?: number; search?: string; studentId?: string; status?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { student: { fullName: { contains: query.search, mode: "insensitive" } } },
        { remarks: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.studentId) {
      whereClause.studentId = query.studentId;
    }

    if (query.status) {
      whereClause.status = query.status;
    }

    const [results, total] = await Promise.all([
      prismaMain.result.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          student: true,
          exam: true,
          subjects: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.result.count({ where: whereClause }),
    ]);

    return {
      results,
      pagination: {
        page,
        limit,
        total,
      },
    };
  },

  async create(data: ResultCreateInput, userId?: string) {
    // Validate student exists
    const student = await prismaMain.student.findFirst({
      where: { id: data.studentId, deletedAt: null },
    });

    if (!student) {
      throw new CustomError("Student not found or has been deleted", 404);
    }

    // Validate exam exists
    const exam = await prismaMain.exam.findFirst({
      where: { id: data.examId, deletedAt: null },
    });

    if (!exam) {
      throw new CustomError("Exam not found or has been deleted", 404);
    }

    // Check duplicate [studentId, examId]
    const existing = await prismaMain.result.findFirst({
      where: {
        studentId: data.studentId,
        examId: data.examId,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new CustomError("A result already exists for this student and exam", 409);
    }

    try {
      const result = await prismaMain.result.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          student: true,
          exam: true,
          subjects: true,
        },
      });
      return result;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A result already exists for this student and exam", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const result = await prismaMain.result.findFirst({
      where: { id, deletedAt: null },
      include: {
        student: true,
        exam: true,
        subjects: true,
      },
    });

    if (!result) {
      throw new CustomError("Result not found", 404);
    }

    return result;
  },

  async update(id: string, data: ResultUpdateInput, userId?: string) {
    const existing = await prismaMain.result.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Result not found", 404);
    }

    try {
      const updated = await prismaMain.result.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        } as any,
        include: {
          student: true,
          exam: true,
          subjects: true,
        },
      });
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A result already exists for this student and exam", 409);
      }
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.result.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Result not found", 404);
    }

    await prismaMain.result.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
