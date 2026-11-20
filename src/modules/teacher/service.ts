import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { EMPLOYEE_SAFE_SELECT, assertSingleRoleProfile } from "@/utils/employee";
import { CustomError } from "@/errors/CustomError";
import { TeacherCreateInput, TeacherUpdateInput } from "./validator";

export const TeacherService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

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
        take: toPrismaTake(limit),
        include: {
          employee: { select: EMPLOYEE_SAFE_SELECT },
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

    await assertSingleRoleProfile(prismaMain, data.employeeId, "TEACHER");

    try {
      const teacher = await prismaMain.teacher.create({
        data: {
          ...data,
          employeeId: data.employeeId,
          createdBy: userId,
        },
        include: {
          employee: { select: EMPLOYEE_SAFE_SELECT },
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
        employee: { select: EMPLOYEE_SAFE_SELECT },
        assignments: { include: { batchTermSubject: true } },
        sessions: true,
      },
    });

    if (!teacher) {
      throw new CustomError("Teacher not found", 404);
    }

    return teacher;
  },

  async update(id: string, data: TeacherUpdateInput, userId?: string) {
    const existing = await prismaMain.teacher.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Teacher not found", 404);
    }

    if (data.employeeId) {
      const employee = await prismaMain.employee.findFirst({
        where: { id: data.employeeId, deletedAt: null },
      });

      if (!employee) {
        throw new CustomError("Employee not found or has been deleted", 404);
      }
    }

    if (data.employeeId) await assertSingleRoleProfile(prismaMain, data.employeeId, "TEACHER");

    try {
      const updated = await prismaMain.teacher.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        } as any,
        include: {
          employee: { select: EMPLOYEE_SAFE_SELECT },
          assignments: { include: { batchTermSubject: true } },
          sessions: true,
        },
      });
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("An employee with this ID is already assigned as Teacher", 409);
      }
      throw error;
    }
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