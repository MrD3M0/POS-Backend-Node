import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { SalaryComponentCreateInput, SalaryComponentUpdateInput } from "./validator";

export const SalaryComponentService = {
  async index(query: { page?: number; limit?: number; search?: string; isActive?: boolean }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { code: { contains: query.search, mode: "insensitive" } },
        { name: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.isActive !== undefined) {
      whereClause.isActive = query.isActive;
    }

    const [components, total] = await Promise.all([
      prismaMain.salaryComponent.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          structureItems: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.salaryComponent.count({ where: whereClause }),
    ]);

    return {
      components,
      pagination: {
        page,
        limit,
        total,
      },
    };
  },

  async create(data: SalaryComponentCreateInput, userId?: string) {
    // Check duplicate code
    const existing = await prismaMain.salaryComponent.findFirst({
      where: { code: data.code, deletedAt: null },
    });

    if (existing) {
      throw new CustomError("A salary component with this code already exists", 409);
    }

    try {
      const component = await prismaMain.salaryComponent.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          structureItems: true,
        },
      });
      return component;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A salary component with this code already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const component = await prismaMain.salaryComponent.findFirst({
      where: { id, deletedAt: null },
      include: {
        structureItems: true,
      },
    });

    if (!component) {
      throw new CustomError("Salary component not found", 404);
    }

    return component;
  },

  async update(id: string, data: SalaryComponentUpdateInput, userId?: string) {
    const existing = await prismaMain.salaryComponent.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Salary component not found", 404);
    }

    try {
      const updated = await prismaMain.salaryComponent.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        },
        include: {
          structureItems: true,
        },
      });
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A salary component with this code already exists", 409);
      }
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.salaryComponent.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Salary component not found", 404);
    }

    await prismaMain.salaryComponent.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
