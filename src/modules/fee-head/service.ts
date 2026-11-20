import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import { FeeHeadCreateInput, FeeHeadUpdateInput } from "./validator";

export const FeeHeadService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 50);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: Record<string, unknown> = { deletedAt: null };
    if (query.search) {
      whereClause.OR = [
        { code: { contains: query.search, mode: "insensitive" } },
        { name: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prismaMain.feeHead.findMany({ where: whereClause, skip, take: toPrismaTake(limit), orderBy: { createdAt: "desc" }, include: { _count: { select: { structureItems: true, studentItems: true } } } }),
      prismaMain.feeHead.count({ where: whereClause }),
    ]);

    return { data: items, pagination: { page, limit, total } };
  },

  async create(data: FeeHeadCreateInput, userId?: string) {
    try {
      return await prismaMain.feeHead.create({ data: { ...data, createdBy: userId } });
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === "P2002") throw new CustomError("A fee head with this code already exists", 409);
      throw error;
    }
  },

  async getById(id: string) {
    const head = await prismaMain.feeHead.findFirst({ where: { id, deletedAt: null } });
    if (!head) throw new CustomError("Fee head not found", 404);
    return head;
  },

  async update(id: string, data: FeeHeadUpdateInput, userId?: string) {
    const existing = await prismaMain.feeHead.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new CustomError("Fee head not found", 404);
    if (data.isActive === false) {
      const inUse = await prismaMain.feeStructureItem.count({ where: { feeHeadId: id } });
      if (inUse > 0) throw new CustomError(`Used in ${inUse} fee structure items; review before deactivating`, 409);
    }
    try {
      return await prismaMain.feeHead.update({ where: { id }, data: { ...data, updatedBy: userId } });
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === "P2002") throw new CustomError("A fee head with this code already exists", 409);
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.feeHead.findFirst({ where: { id, deletedAt: null }, include: { _count: { select: { structureItems: true, studentItems: true } } } });
    if (!existing) throw new CustomError("Fee head not found", 404);
    if (existing._count.structureItems > 0 || existing._count.studentItems > 0) {
      throw new CustomError("Fee head is in use; deactivate instead", 409);
    }
    await prismaMain.feeHead.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: userId } });
    return null;
  },
};
