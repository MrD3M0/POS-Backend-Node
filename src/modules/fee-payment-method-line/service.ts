import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import { FeePaymentMethodLineCreateInput } from "./validator";

/**
 * Method lines are written only as part of POST /fee-payment (together with
 * the payment total and its journal posting). Direct creates/deletes would
 * break the methodLines == total == allocations invariant.
 */
const DIRECT_WRITE_MESSAGE =
  "Method lines are managed through POST /fee-payment; cancel the payment instead of editing its lines";

export const FeePaymentMethodLineService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: Record<string, unknown> = {};

    if (query.search) {
      whereClause.OR = [
        { feePaymentId: { contains: query.search, mode: "insensitive" } },
        { referenceNo: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [lines, total] = await Promise.all([
      prismaMain.feePaymentMethodLine.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: {
          paymentMethod: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.feePaymentMethodLine.count({ where: whereClause }),
    ]);

    return {
      data: lines,
      pagination: { page, limit, total },
    };
  },

  async create(_data: FeePaymentMethodLineCreateInput, _userId?: string) {
    throw new CustomError(DIRECT_WRITE_MESSAGE, 409);
  },

  async getById(id: string) {
    const line = await prismaMain.feePaymentMethodLine.findUnique({
      where: { id },
      include: {
        paymentMethod: true,
      },
    });

    if (!line) {
      throw new CustomError("Fee payment method line not found", 404);
    }

    return line;
  },

  async delete(_id: string, _userId?: string) {
    throw new CustomError(DIRECT_WRITE_MESSAGE, 409);
  },
};
