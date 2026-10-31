import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { TeacherCreateInput } from "./validator";

export const TeacherService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { employee: { firstName: { contains: query.search, mode: "insensitive" } } },
        { employee: { lastName: { contains: query.search, mode: "insensitive" } } },
        { employee: { employeeCode: { contains: query.search, mode: "insensitive" } } },
      ];
    }

    const [teachers, total] = await Promise.all([
      prismaMain.teacher.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          employee: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.teacher.count({ where: whereClause }),
    ]);

    return {
      teachers,
      pagination: {
        page,
        limit,
        total,
      },
    };
  },

  async create(data: TeacherCreateInput, userId?: string) {
    // Validate employee exists and is not soft-deleted
    const employee = await prismaMain.employee.findFirst({
      where: { id: data.employeeId, deletedAt: null },
    });

    if (!employee) {
      throw new CustomError("Employee not found or has been deleted", 404);
    }

    try {
      const teacher = await prismaMain.teacher.create({
        data: {
          ...data,
          employeeId: data.employeeId,
          createdBy: userId,
        },
        include: {
          employee: true,
        },
      });
      return teacher;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("An employee with this ID is already assigned as Teacher", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const teacher = await prismaMain.teacher.findFirst({
      where: { id, deletedAt: null },
      include: {
        employee: true,
        assignments: { include: { batchTermSubject: true } },
        sessions: true,
      },
    });

    if (!teacher) {
      throw new CustomError("Teacher not found", 404);
    }

    return teacher;
  },

  async delete(id: string, userId?: string) {
    const teacher = await prismaMain.teacher.findFirst({
      where: { id, deletedAt: null },
    });

    if (!teacher) {
      throw new CustomError("Teacher not found", 404);
    }

    await prismaMain.teacher.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};