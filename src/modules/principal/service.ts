import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { EMPLOYEE_SAFE_SELECT, assertSingleRoleProfile } from "@/utils/employee";
import { CustomError } from "@/errors/CustomError";
import { PrincipalCreateInput, PrincipalUpdateInput } from "./validator";

export const PrincipalService = {
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

    const [principals, total] = await Promise.all([
      prismaMain.principal.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: {
          employee: { select: EMPLOYEE_SAFE_SELECT },
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.principal.count({ where: whereClause }),
    ]);

    return {
      principals,
      pagination: {
        page,
        limit,
        total,
      },
    };
  },

  async create(data: PrincipalCreateInput, userId?: string) {
    // Validate employee exists and is not soft-deleted
    const employee = await prismaMain.employee.findFirst({
      where: { id: data.employeeId, deletedAt: null },
    });

    if (!employee) {
      throw new CustomError("Employee not found or has been deleted", 404);
    }

    await assertSingleRoleProfile(prismaMain, data.employeeId, "PRINCIPAL");

    try {
      const principal = await prismaMain.principal.create({
        data: {
          ...data,
          employeeId: data.employeeId,
          createdBy: userId,
        },
        include: {
          employee: { select: EMPLOYEE_SAFE_SELECT },
        },
      });
      return principal;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("An employee with this ID is already assigned as Principal", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const principal = await prismaMain.principal.findFirst({
      where: { id, deletedAt: null },
      include: {
        employee: { select: EMPLOYEE_SAFE_SELECT },
      },
    });

    if (!principal) {
      throw new CustomError("Principal not found", 404);
    }

    return principal;
  },

  async update(id: string, data: PrincipalUpdateInput, userId?: string) {
    const existing = await prismaMain.principal.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Principal not found", 404);
    }

    if (data.employeeId) {
      const employee = await prismaMain.employee.findFirst({
        where: { id: data.employeeId, deletedAt: null },
      });

      if (!employee) {
        throw new CustomError("Employee not found or has been deleted", 404);
      }
    }

    if (data.employeeId) await assertSingleRoleProfile(prismaMain, data.employeeId, "PRINCIPAL");

    try {
      const updated = await prismaMain.principal.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        } as any,
        include: {
          employee: { select: EMPLOYEE_SAFE_SELECT },
        },
      });
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("An employee with this ID is already assigned as Principal", 409);
      }
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const principal = await prismaMain.principal.findFirst({
      where: { id, deletedAt: null },
    });

    if (!principal) {
      throw new CustomError("Principal not found", 404);
    }

    await prismaMain.principal.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};