import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { EMPLOYEE_SAFE_SELECT, assertSingleRoleProfile } from "@/utils/employee";
import { CustomError } from "@/errors/CustomError";
import { AccountantCreateInput } from "./validator";

export const AccountantService = {
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

    const [accountants, total] = await Promise.all([
      prismaMain.accountant.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: {
          employee: { select: EMPLOYEE_SAFE_SELECT },
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.accountant.count({ where: whereClause }),
    ]);

    return {
      data: accountants,
      pagination: { page, limit, total },
    };
  },

  async create(data: AccountantCreateInput, userId?: string) {
    // Validate employee exists and is not soft-deleted
    const employee = await prismaMain.employee.findFirst({
      where: { id: data.employeeId, deletedAt: null },
    });

    if (!employee) {
      throw new CustomError("Employee not found or has been deleted", 404);
    }

    await assertSingleRoleProfile(prismaMain, data.employeeId, "ACCOUNTANT");

    try {
      const accountant = await prismaMain.accountant.create({
        data: {
          ...data,
          employeeId: data.employeeId,
          createdBy: userId,
        },
        include: {
          employee: { select: EMPLOYEE_SAFE_SELECT },
        },
      });
      return accountant;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("An employee is already assigned as Accountant", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const accountant = await prismaMain.accountant.findFirst({
      where: { id, deletedAt: null },
      include: {
        employee: { select: EMPLOYEE_SAFE_SELECT },
      },
    });

    if (!accountant) {
      throw new CustomError("Accountant not found", 404);
    }

    return accountant;
  },

  async delete(id: string, userId?: string) {
    const accountant = await prismaMain.accountant.findFirst({
      where: { id, deletedAt: null },
    });

    if (!accountant) {
      throw new CustomError("Accountant not found", 404);
    }

    await prismaMain.accountant.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
