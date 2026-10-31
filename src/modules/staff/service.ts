import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { StaffCreateInput } from "./validator";

export const StaffService = {
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

    const [staffs, total] = await Promise.all([
      prismaMain.staff.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          employee: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.staff.count({ where: whereClause }),
    ]);

    return {
      staffs,
      pagination: {
        page,
        limit,
        total,
      },
    };
  },

  async create(data: StaffCreateInput, userId?: string) {
    // Validate employee exists and is not soft-deleted
    const employee = await prismaMain.employee.findFirst({
      where: { id: data.employeeId, deletedAt: null },
    });

    if (!employee) {
      throw new CustomError("Employee not found or has been deleted", 404);
    }

    try {
      const staff = await prismaMain.staff.create({
        data: {
          ...data,
          employeeId: data.employeeId,
          createdBy: userId,
        },
        include: {
          employee: true,
        },
      });
      return staff;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("An employee with this ID is already assigned as Staff", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const staff = await prismaMain.staff.findFirst({
      where: { id, deletedAt: null },
      include: {
        employee: true,
      },
    });

    if (!staff) {
      throw new CustomError("Staff not found", 404);
    }

    return staff;
  },

  async delete(id: string, userId?: string) {
    const staff = await prismaMain.staff.findFirst({
      where: { id, deletedAt: null },
    });

    if (!staff) {
      throw new CustomError("Staff not found", 404);
    }

    await prismaMain.staff.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};