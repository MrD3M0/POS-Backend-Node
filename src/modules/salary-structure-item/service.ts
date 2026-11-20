import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import { SalaryStructureItemCreateInput, SalaryStructureItemUpdateInput } from "./validator";

export const SalaryStructureItemService = {
  async index(query: { page?: number; limit?: number; search?: string; salaryStructureId?: string; componentId?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: any = {};
    if (query.salaryStructureId) whereClause.salaryStructureId = query.salaryStructureId;
    if (query.componentId) whereClause.componentId = query.componentId;

    if (query.search) {
      whereClause.OR = [
        { component: { name: { contains: query.search, mode: "insensitive" } } },
        { component: { code: { contains: query.search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prismaMain.salaryStructureItem.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: {
          component: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.salaryStructureItem.count({ where: whereClause }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
      },
    };
  },

  async create(data: SalaryStructureItemCreateInput, userId?: string) {
    // Validate component exists and is not soft-deleted
    const component = await prismaMain.salaryComponent.findFirst({
      where: { id: data.componentId, deletedAt: null },
    });

    if (!component) {
      throw new CustomError("Salary component not found or has been deleted", 404);
    }

    // Validate parent structure exists and is not soft-deleted
    // (previously this wrongly looked up `data.componentId` as the structure id)
    const structure = await prismaMain.salaryStructure.findFirst({
      where: { id: data.salaryStructureId, deletedAt: null },
    });

    if (!structure) {
      throw new CustomError("Salary structure not found or has been deleted", 404);
    }

    try {
      const item = await prismaMain.salaryStructureItem.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          component: true,
        },
      });
      return item;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A salary structure item already exists for this component in this structure", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const item = await prismaMain.salaryStructureItem.findFirst({
      where: { id, deletedAt: null },
      include: {
        component: true,
      },
    });

    if (!item) {
      throw new CustomError("Salary structure item not found", 404);
    }

    return item;
  },

  async update(id: string, data: SalaryStructureItemUpdateInput, userId?: string) {
    const existing = await prismaMain.salaryStructureItem.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Salary structure item not found", 404);
    }

    try {
      const updated = await prismaMain.salaryStructureItem.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        },
        include: {
          component: true,
        },
      });
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A salary structure item already exists for this component in this structure", 409);
      }
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.salaryStructureItem.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Salary structure item not found", 404);
    }

    await prismaMain.salaryStructureItem.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
