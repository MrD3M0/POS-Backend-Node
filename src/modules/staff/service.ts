import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { EMPLOYEE_SAFE_SELECT, assertSingleRoleProfile } from "@/utils/employee";
import { CustomError } from "@/errors/CustomError";
import { StaffCreateInput, StaffUpdateInput } from "./validator";

export const StaffService = {
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

    const [staffs, total] = await Promise.all([
      prismaMain.staff.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: {
          employee: { select: EMPLOYEE_SAFE_SELECT },
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

    await assertSingleRoleProfile(prismaMain, data.employeeId, "STAFF");

    try {
      const staff = await prismaMain.staff.create({
        data: {
          ...data,
          employeeId: data.employeeId,
          createdBy: userId,
        },
        include: {
          employee: { select: EMPLOYEE_SAFE_SELECT },
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
        employee: { select: EMPLOYEE_SAFE_SELECT },
      },
    });

    if (!staff) {
      throw new CustomError("Staff not found", 404);
    }

    return staff;
  },

  async getMe(userId: string) {
    const employee = await prismaMain.employee.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!employee) {
      throw new CustomError("Employee profile not found for this user", 404);
    }

    const staff = await prismaMain.staff.findFirst({
      where: { employeeId: employee.id, deletedAt: null },
      include: {
        employee: { select: EMPLOYEE_SAFE_SELECT },
      },
    });

    if (!staff) {
      throw new CustomError("Staff profile not found for this user", 404);
    }

    return staff;
  },

  async update(id: string, data: StaffUpdateInput, userId?: string) {
    const existing = await prismaMain.staff.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Staff not found", 404);
    }

    if (data.employeeId) {
      const employee = await prismaMain.employee.findFirst({
        where: { id: data.employeeId, deletedAt: null },
      });

      if (!employee) {
        throw new CustomError("Employee not found or has been deleted", 404);
      }
    }

    if (data.employeeId) await assertSingleRoleProfile(prismaMain, data.employeeId, "STAFF");

    try {
      const { firstName, lastName, phone, permanentAddress, temporaryAddress, address, ...staffData } = data as any;

      const employeeUpdate: Record<string, unknown> = {};
      if (firstName !== undefined) employeeUpdate.firstName = firstName;
      if (lastName !== undefined) employeeUpdate.lastName = lastName;
      if (phone !== undefined) employeeUpdate.phone = phone;
      if (permanentAddress !== undefined) employeeUpdate.permanentAddress = permanentAddress;
      if (temporaryAddress !== undefined) employeeUpdate.temporaryAddress = temporaryAddress;
      if (address !== undefined) {
        employeeUpdate.permanentAddress = address;
        employeeUpdate.temporaryAddress = address;
      }

      const updated = await prismaMain.$transaction(async (tx) => {
        if (Object.keys(employeeUpdate).length > 0) {
          await tx.employee.update({
            where: { id: existing.employeeId },
            data: { ...employeeUpdate, updatedBy: userId },
          });
        }

        return tx.staff.update({
          where: { id },
          data: {
            ...staffData,
            updatedBy: userId,
          } as any,
          include: {
            employee: { select: EMPLOYEE_SAFE_SELECT },
          },
        });
      });
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("An employee with this ID is already assigned as Staff", 409);
      }
      throw error;
    }
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