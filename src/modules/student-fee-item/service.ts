import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import {
  StudentFeeItemCreateInput,
  StudentFeeItemUpdateInput,
} from "./validator";
import { dec, round2 } from "@/lib/money";

interface ComputedItemFields {
  amount: string;
  discountAmount: string;
  discountReason: string | undefined;
  netAmount: string;
  isSkipped: boolean;
  skipReason: string | undefined;
}

/**
 * Totalling rule shared by create/update:
 *  - netAmount = amount - discountAmount (Decimal math)
 *  - a discount is only valid with a reason; a skip requires a reason
 */
function computeItemFields(
  input: {
    amount?: string | number;
    discountAmount?: string | number;
    discountReason?: string;
    isSkipped?: boolean;
    skipReason?: string;
  },
  existing?: {
    amount: Parameters<typeof dec>[0] & NonNullable<Parameters<typeof dec>[0]>;
    discountAmount: Parameters<typeof dec>[0] & NonNullable<Parameters<typeof dec>[0]>;
    discountReason: string | null;
    isSkipped: boolean;
    skipReason: string | null;
  } | null,
): ComputedItemFields {
  const amount = dec(
    input.amount ?? existing?.amount ?? "0",
    "amount",
  );
  const discountAmount = dec(
    input.discountAmount ?? existing?.discountAmount ?? "0",
    "discountAmount",
  );
  const discountReason = input.discountReason ?? existing?.discountReason ?? undefined;
  const isSkipped = input.isSkipped ?? existing?.isSkipped ?? false;
  const skipReason = input.skipReason ?? existing?.skipReason ?? undefined;

  if (amount.isNegative()) {
    throw new CustomError("Amount cannot be negative", 400);
  }
  if (discountAmount.isNegative()) {
    throw new CustomError("Discount amount cannot be negative", 400);
  }
  if (discountAmount.gt(amount)) {
    throw new CustomError("Discount cannot exceed the fee amount", 400);
  }
  if (discountAmount.isPositive() && !discountReason?.trim()) {
    throw new CustomError("A discount requires a discount reason", 400);
  }
  if (isSkipped && !skipReason?.trim()) {
    throw new CustomError("Skipping a fee requires a skip reason", 400);
  }

  return {
    amount: round2(amount).toFixed(2),
    discountAmount: round2(discountAmount).toFixed(2),
    discountReason: discountReason?.trim() || undefined,
    netAmount: round2(amount.minus(discountAmount)).toFixed(2),
    isSkipped,
    skipReason: skipReason?.trim() || undefined,
  };
}

export const StudentFeeItemService = {
  async index(query: { page?: number; limit?: number; search?: string; studentFeeId?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: Record<string, unknown> = {
      deletedAt: null,
    };

    if (query.studentFeeId) {
      whereClause.studentFeeId = query.studentFeeId;
    }

    if (query.search) {
      whereClause.OR = [
        { feeHeadId: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { dueDateBs: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prismaMain.studentFeeItem.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: { feeHead: true, installments: true },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.studentFeeItem.count({ where: whereClause }),
    ]);

    return {
      data: items,
      pagination: { page, limit, total },
    };
  },

  async create(data: StudentFeeItemCreateInput, userId?: string) {
    const [parentFee, feeHead] = await Promise.all([
      prismaMain.studentFee.findFirst({
        where: { id: data.studentFeeId, deletedAt: null },
      }),
      prismaMain.feeHead.findFirst({
        where: { id: data.feeHeadId, deletedAt: null },
      }),
    ]);
    if (!parentFee) {
      throw new CustomError("Student fee not found", 404);
    }
    if (!feeHead) {
      throw new CustomError("Fee head not found", 404);
    }

    const feeStructureItemId = data.feeStructureItemId ?? null;
    if (feeStructureItemId) {
      const structureItem = await prismaMain.feeStructureItem.findFirst({
        where: { id: feeStructureItemId, deletedAt: null },
      });
      if (!structureItem) {
        throw new CustomError("Fee structure item not found", 404);
      }
      const duplicate = await prismaMain.studentFeeItem.findFirst({
        where: {
          studentFeeId: data.studentFeeId,
          feeStructureItemId,
          deletedAt: null,
        },
      });
      if (duplicate) {
        throw new CustomError(
          "This structure item is already copied to the student's fee",
          409,
        );
      }
    }

    const fields = computeItemFields(data);

    try {
      const item = await prismaMain.studentFeeItem.create({
        data: {
          studentFeeId: data.studentFeeId,
          feeHeadId: data.feeHeadId,
          feeStructureItemId,
          termNumber: data.termNumber ?? null,
          description: data.description ?? null,
          dueDateBs: data.dueDateBs ?? null,
          ...fields,
          ...(userId && { createdBy: userId }),
        },
        include: { feeHead: true },
      });
      return item;
    } catch (error: unknown) {
      if ((error as { code?: string } | null)?.code === "P2002") {
        throw new CustomError(
          "A student fee item already exists for this fee and term",
          409,
        );
      }
      throw error;
    }
  },

  async update(id: string, data: StudentFeeItemUpdateInput, userId?: string) {
    const existing = await prismaMain.studentFeeItem.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new CustomError("Student fee item not found", 404);
    }
    const hasPayments = await prismaMain.feePaymentAllocation.count({
      where: { studentFeeItemId: id },
    });
    if (hasPayments > 0 && (data.amount !== undefined || data.discountAmount !== undefined)) {
      throw new CustomError(
        "Cannot change amount/discount after payments were allocated; cancel those payments first",
        409,
      );
    }

    const fields = computeItemFields(data, {
      amount: existing.amount,
      discountAmount: existing.discountAmount,
      discountReason: existing.discountReason,
      isSkipped: existing.isSkipped,
      skipReason: existing.skipReason,
    });

    const item = await prismaMain.studentFeeItem.update({
      where: { id },
      data: {
        description: data.description ?? existing.description,
        dueDateBs: data.dueDateBs ?? existing.dueDateBs,
        ...fields,
        updatedBy: userId,
      },
      include: { feeHead: true },
    });
    return item;
  },

  async getById(id: string) {
    const item = await prismaMain.studentFeeItem.findFirst({
      where: { id, deletedAt: null },
      include: { feeHead: true, installments: { where: { deletedAt: null } } },
    });

    if (!item) {
      throw new CustomError("Student fee item not found", 404);
    }

    return item;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.studentFeeItem.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { allocations: true } },
      },
    });

    if (!existing) {
      throw new CustomError("Student fee item not found", 404);
    }
    if (existing._count.allocations > 0) {
      throw new CustomError(
        "Student fee item has payments allocated and cannot be deleted; cancel those payments or adjust the item instead",
        409,
      );
    }

    await prismaMain.studentFeeItem.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
