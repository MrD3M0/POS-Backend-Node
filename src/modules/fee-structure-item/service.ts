import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import { FeeStructureItemCreateInput } from "./validator";
import { dec } from "@/lib/money";

export const FeeStructureItemService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: Record<string, unknown> = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { feeHeadId: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prismaMain.feeStructureItem.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: {
          feeHead: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.feeStructureItem.count({ where: whereClause }),
    ]);

    return {
      data: items,
      pagination: { page, limit, total },
    };
  },

  async create(data: FeeStructureItemCreateInput, userId?: string) {
    const structure = await prismaMain.feeStructure.findFirst({
      where: { id: data.feeStructureId, deletedAt: null },
    });
    if (!structure) {
      throw new CustomError("Fee structure not found", 404);
    }

    const feeHead = await prismaMain.feeHead.findFirst({
      where: { id: data.feeHeadId, deletedAt: null },
    });
    if (!feeHead) {
      throw new CustomError("Fee head not found", 404);
    }
    if (!feeHead.isActive) {
      throw new CustomError("Fee head is inactive", 400);
    }

    const termNumber = data.termNumber ?? null;
    // One (head, term) row per structure — checked here because Postgres
    // treats NULLs as distinct and the schema's unique cannot cover
    // one-time (NULL term) rows; see docs/constraints.sql.
    const duplicate = await prismaMain.feeStructureItem.findFirst({
      where: {
        feeStructureId: data.feeStructureId,
        feeHeadId: data.feeHeadId,
        termNumber,
        deletedAt: null,
      },
    });
    if (duplicate) {
      throw new CustomError(
        "A fee structure item for this head and term already exists",
        409,
      );
    }

    try {
      const item = await prismaMain.feeStructureItem.create({
        data: {
          feeStructureId: data.feeStructureId,
          feeHeadId: data.feeHeadId,
          termNumber,
          amount: dec(data.amount, "amount"),
          ...(userId && { createdBy: userId }),
        },
        include: {
          feeHead: true,
        },
      });
      return item;
    } catch (error: unknown) {
      if ((error as { code?: string } | null)?.code === "P2002") {
        throw new CustomError(
          "A fee structure item for this head and term already exists",
          409,
        );
      }
      throw error;
    }
  },

  async getById(id: string) {
    const item = await prismaMain.feeStructureItem.findFirst({
      where: { id, deletedAt: null },
      include: {
        feeHead: true,
      },
    });

    if (!item) {
      throw new CustomError("Fee structure item not found", 404);
    }

    return item;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.feeStructureItem.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { studentItems: true } },
      },
    });

    if (!existing) {
      throw new CustomError("Fee structure item not found", 404);
    }
    if (existing._count.studentItems > 0) {
      throw new CustomError(
        "Fee structure item is copied to student fees and cannot be deleted",
        409,
      );
    }

    await prismaMain.feeStructureItem.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
