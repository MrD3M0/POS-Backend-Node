import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { EmployeeCreateInput, EmployeeUpdateInput } from "./validator";

export const EmployeeService = {
  async index(query: { page?: number; limit?: number; search?: string; isActive?: boolean }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
        { employeeCode: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.isActive !== undefined) {
      whereClause.isActive = query.isActive;
    }

    const [employees, total] = await Promise.all([
      prismaMain.employee.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, email: true, username: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.employee.count({ where: whereClause }),
    ]);

    return {
      employees,
      pagination: {
        page,
        limit,
        total,
      },
    };
  },

  async create(data: EmployeeCreateInput, userId?: string) {
    // Check if userId exists and is not soft-deleted
    if (data.userId) {
      const user = await prismaMain.user.findFirst({
        where: { id: data.userId, deletedAt: null },
      });
      if (!user) {
        throw new CustomError("User not found or has been deleted", 404);
      }
    }

    // Check duplicate employeeCode
    const existingCode = await prismaMain.employee.findFirst({
      where: { employeeCode: data.employeeCode, deletedAt: null },
    });

    if (existingCode) {
      throw new CustomError("An employee with this code already exists", 409);
    }

    // Check duplicate panNo
    if (data.panNo) {
      const existingPan = await prismaMain.employee.findFirst({
        where: { panNo: data.panNo, deletedAt: null },
      });
      if (existingPan) {
        throw new CustomError("An employee with this PAN number already exists", 409);
      }
    }

    // Check duplicate ssfNo
    if (data.ssfNo) {
      const existingSsf = await prismaMain.employee.findFirst({
        where: { ssfNo: data.ssfNo, deletedAt: null },
      });
      if (existingSsf) {
        throw new CustomError("An employee with this SSF number already exists", 409);
      }
    }

    try {
      const employee = await prismaMain.employee.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          user: { select: { id: true, email: true, username: true, role: true } },
        },
      });
      return employee;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("Duplicate entry found", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const employee = await prismaMain.employee.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, email: true, username: true, role: true } },
        principal: true,
        teacher: true,
        accountant: true,
        staff: true,
      },
    });

    if (!employee) {
      throw new CustomError("Employee not found", 404);
    }

    return employee;
  },

  async update(id: string, data: EmployeeUpdateInput, userId?: string) {
    const employee = await prismaMain.employee.findFirst({
      where: { id, deletedAt: null },
    });

    if (!employee) {
      throw new CustomError("Employee not found", 404);
    }

    // Check if userId exists
    if (data.userId) {
      const user = await prismaMain.user.findFirst({
        where: { id: data.userId, deletedAt: null },
      });
      if (!user) {
        throw new CustomError("User not found or has been deleted", 404);
      }
    }

    // Check duplicate employeeCode
    if (data.employeeCode && data.employeeCode !== employee.employeeCode) {
      const duplicate = await prismaMain.employee.findFirst({
        where: {
          employeeCode: data.employeeCode,
          NOT: { id },
          deletedAt: null,
        },
      });
      if (duplicate) {
        throw new CustomError("An employee with this code already exists", 409);
      }
    }

    // Check duplicate panNo
    if (data.panNo && data.panNo !== employee.panNo) {
      const duplicate = await prismaMain.employee.findFirst({
        where: {
          panNo: data.panNo,
          NOT: { id },
          deletedAt: null,
        },
      });
      if (duplicate) {
        throw new CustomError("An employee with this PAN number already exists", 409);
      }
    }

    // Check duplicate ssfNo
    if (data.ssfNo && data.ssfNo !== employee.ssfNo) {
      const duplicate = await prismaMain.employee.findFirst({
        where: {
          ssfNo: data.ssfNo,
          NOT: { id },
          deletedAt: null,
        },
      });
      if (duplicate) {
        throw new CustomError("An employee with this SSF number already exists", 409);
      }
    }

    try {
      const updated = await prismaMain.employee.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        },
        include: {
          user: { select: { id: true, email: true, username: true, role: true } },
        },
      });
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("Duplicate entry found", 409);
      }
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const employee = await prismaMain.employee.findFirst({
      where: { id, deletedAt: null },
    });

    if (!employee) {
      throw new CustomError("Employee not found", 404);
    }

    await prismaMain.employee.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};