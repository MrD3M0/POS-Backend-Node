import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { EmployeeAttendanceCreateInput } from "./validator";

export const EmployeeAttendanceService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { employeeId: { contains: query.search, mode: "insensitive" } },
        { dateBs: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [records, total] = await Promise.all([
      prismaMain.employeeAttendance.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          leaveType: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.employeeAttendance.count({ where: whereClause }),
    ]);

    return {
      data: records,
      pagination: { page, limit, total },
    };
  },

  async create(data: EmployeeAttendanceCreateInput, userId?: string) {
    // Validate employee exists and is not soft-deleted
    const employee = await prismaMain.employee.findFirst({
      where: { id: data.employeeId, deletedAt: null },
    });

    if (!employee) {
      throw new CustomError("Employee not found or has been deleted", 404);
    }

    try {
      const record = await prismaMain.employeeAttendance.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          leaveType: true,
        },
      });
      return record;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("An attendance record for this employee on this date already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const record = await prismaMain.employeeAttendance.findFirst({
      where: { id, deletedAt: null },
      include: {
        leaveType: true,
      },
    });

    if (!record) {
      throw new CustomError("Employee attendance record not found", 404);
    }

    return record;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.employeeAttendance.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Employee attendance record not found", 404);
    }

    await prismaMain.employeeAttendance.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
