import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import {
  FeeInstallmentBulkInput,
  FeeInstallmentCreateInput,
} from "./validator";
import { dec, moneyEq, moneyStr, round2, sumMoney } from "@/lib/money";

async function loadItemOr404(studentFeeItemId: string) {
  const item = await prismaMain.studentFeeItem.findFirst({
    where: { id: studentFeeItemId, deletedAt: null },
  });
  if (!item) {
    throw new CustomError("Student fee item not found", 404);
  }
  return item;
}

export const FeeInstallmentService = {
  async index(query: { page?: number; limit?: number; search?: string; studentFeeItemId?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: Record<string, unknown> = {
      deletedAt: null,
    };

    if (query.studentFeeItemId) {
      whereClause.studentFeeItemId = query.studentFeeItemId;
    }

    if (query.search) {
      whereClause.OR = [
        { studentFeeItemId: { contains: query.search, mode: "insensitive" } },
        { dueDateBs: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [installments, total] = await Promise.all([
      prismaMain.feeInstallment.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: {
          studentFeeItem: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.feeInstallment.count({ where: whereClause }),
    ]);

    return {
      data: installments,
      pagination: { page, limit, total },
    };
  },

  /**
   * Adds one installment. The running total of installments for the item
   * must never exceed the item's netAmount.
   */
  async create(data: FeeInstallmentCreateInput, userId?: string) {
    const item = await loadItemOr404(data.studentFeeItemId);
    if (item.isSkipped) {
      throw new CustomError("Cannot schedule installments for a skipped fee", 400);
    }

    const amount = dec(data.amount, "amount");
    const existing = await prismaMain.feeInstallment.findMany({
      where: { studentFeeItemId: data.studentFeeItemId, deletedAt: null },
    });
    if (existing.some((row) => row.installmentNo === data.installmentNo)) {
      throw new CustomError(
        "An installment with this number already exists for this fee item",
        409,
      );
    }
    const scheduledTotal = sumMoney(existing.map((row) => row.amount));
    if (round2(scheduledTotal.plus(amount)).gt(round2(item.netAmount))) {
      throw new CustomError(
        `Installments total would exceed the fee net amount (${moneyStr(item.netAmount)})`,
        400,
      );
    }

    try {
      const installment = await prismaMain.feeInstallment.create({
        data: {
          studentFeeItemId: data.studentFeeItemId,
          installmentNo: data.installmentNo,
          dueDateBs: data.dueDateBs,
          amount,
          ...(userId && { createdBy: userId }),
        },
        include: {
          studentFeeItem: true,
        },
      });
      return installment;
    } catch (error: unknown) {
      if ((error as { code?: string } | null)?.code === "P2002") {
        throw new CustomError(
          "An installment already exists for this student fee item",
          409,
        );
      }
      throw error;
    }
  },

  /**
   * Schedules a full installment set in one call (atomic). The installments
   * must sum exactly to the item's netAmount.
   */
  async bulk(data: FeeInstallmentBulkInput, userId?: string) {
    const item = await loadItemOr404(data.studentFeeItemId);
    if (item.isSkipped) {
      throw new CustomError("Cannot schedule installments for a skipped fee", 400);
    }

    const existing = await prismaMain.feeInstallment.findMany({
      where: { studentFeeItemId: data.studentFeeItemId, deletedAt: null },
    });
    if (existing.length > 0) {
      throw new CustomError(
        "Installments already exist for this fee item; add them one by one instead",
        409,
      );
    }

    const numbers = data.installments.map((row) => row.installmentNo);
    if (new Set(numbers).size !== numbers.length) {
      throw new CustomError(
        "Installment numbers must be unique within the schedule",
        400,
      );
    }

    const total = sumMoney(
      data.installments.map((row) => dec(row.amount, "installment amount")),
    );
    if (!moneyEq(total, item.netAmount)) {
      throw new CustomError(
        `Installments sum (${moneyStr(total)}) must equal the fee net amount (${moneyStr(item.netAmount)})`,
        400,
      );
    }

    try {
      const created = await prismaMain.$transaction(async (tx) =>
        tx.feeInstallment.createMany({
          data: data.installments.map((row) => ({
            studentFeeItemId: data.studentFeeItemId,
            installmentNo: row.installmentNo,
            dueDateBs: row.dueDateBs,
            amount: dec(row.amount, "installment amount"),
            createdBy: userId,
          })),
        }),
      );
      return created;
    } catch (error: unknown) {
      if ((error as { code?: string } | null)?.code === "P2002") {
        throw new CustomError(
          "An installment already exists for this student fee item",
          409,
        );
      }
      throw error;
    }
  },

  async getById(id: string) {
    const installment = await prismaMain.feeInstallment.findFirst({
      where: { id, deletedAt: null },
      include: {
        studentFeeItem: true,
      },
    });

    if (!installment) {
      throw new CustomError("Fee installment not found", 404);
    }

    return installment;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.feeInstallment.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { allocations: true } },
      },
    });

    if (!existing) {
      throw new CustomError("Fee installment not found", 404);
    }
    if (existing._count.allocations > 0) {
      throw new CustomError(
        "Installment has payments allocated and cannot be deleted",
        409,
      );
    }

    await prismaMain.feeInstallment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
