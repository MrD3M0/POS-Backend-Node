import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import { FeePaymentAllocationCreateInput } from "./validator";

/**
 * Allocations are written only as part of POST /fee-payment (they must sum
 * to the total and fit each item's remaining due). Direct creates/deletes
 * would break that invariant, so they are blocked.
 */
const DIRECT_WRITE_MESSAGE =
  "Allocations are managed through POST /fee-payment; cancel the payment instead of editing its allocations";

export const FeePaymentAllocationService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: Record<string, unknown> = {};

    if (query.search) {
      whereClause.OR = [
        { feePaymentId: { contains: query.search, mode: "insensitive" } },
        { studentFeeItemId: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [allocations, total] = await Promise.all([
      prismaMain.feePaymentAllocation.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: {
          studentFeeItem: true,
          feeInstallment: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.feePaymentAllocation.count({ where: whereClause }),
    ]);

    return {
      data: allocations,
      pagination: { page, limit, total },
    };
  },

  async create(_data: FeePaymentAllocationCreateInput, _userId?: string) {
    throw new CustomError(DIRECT_WRITE_MESSAGE, 409);
  },

  async getById(id: string) {
    const allocation = await prismaMain.feePaymentAllocation.findUnique({
      where: { id },
      include: {
        studentFeeItem: true,
        feeInstallment: true,
      },
    });

    if (!allocation) {
      throw new CustomError("Fee payment allocation not found", 404);
    }

    return allocation;
  },

  async delete(_id: string, _userId?: string) {
    throw new CustomError(DIRECT_WRITE_MESSAGE, 409);
  },
};
