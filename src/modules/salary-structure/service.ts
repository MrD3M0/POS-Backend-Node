import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { SalaryStructureCreateInput, SalaryStructureUpdateInput } from "./validator";

export const SalaryStructureService = {
  async index(query: { page?: number; limit?: number; search?: string; isActive?: boolean }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (query.search) {
      whereClause.OR = [
        { remarks: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [structures, total] = await Promise.all([
      prismaMain.salaryStructure.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          employee: true,
          items: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.salaryStructure.count({ where: whereClause }),
    ]);

    return {
      structures,
      pagination: {
        page,
        limit,
        total,
      },
    };
  },

  async create(data: SalaryStructureCreateInput, userId?: string) {
    // Validate employee exists
    const employee = await prismaMain.employee.findFirst({
      where: { id: data.employeeId, deletedAt: null },
    });

    if (!employee) {
      throw new CustomError("Employee not found or has been deleted", 404);
    }

    try {
      const structure = await prismaMain.salaryStructure.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          employee: true,
          items: true,
        },
      });
      return structure;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A salary structure already exists for this employee", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const structure = await prismaMain.salaryStructure.findFirst({
      where: { id, deletedAt: null },
      include: {
        employee: true,
        items: true,
      },
    });

    if (!structure) {
      throw new CustomError("Salary structure not found", 404);
    }

    return structure;
  },

  async update(id: string, data: SalaryStructureUpdateInput, userId?: string) {
    const existing = await prismaMain.salaryStructure.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Salary structure not found", 404);
    }

    try {
      const updated = await prismaMain.salaryStructure.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        },
        include: {
          employee: true,
          items: true,
        },
      });
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A salary structure already exists for this employee", 409);
      }
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.salaryStructure.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Salary structure not found", 404);
    }

    await prismaMain.salaryStructure.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
