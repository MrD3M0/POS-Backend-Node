import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { FeePaymentAllocationCreateInput } from "./validator";

export const FeePaymentAllocationService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

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
        take: limit,
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

  async create(data: FeePaymentAllocationCreateInput, userId?: string) {
    try {
      const allocation = await prismaMain.feePaymentAllocation.create({
        data: {
          ...data,
          ...(userId && { createdBy: userId }),
        } as any,
        include: {
          studentFeeItem: true,
          feeInstallment: true,
        },
      });
      return allocation;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("An allocation already exists for this payment and student fee item", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const allocation = await prismaMain.feePaymentAllocation.findFirst({
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

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.feePaymentAllocation.findFirst({
      where: { id },
    });

    if (!existing) {
      throw new CustomError("Fee payment allocation not found", 404);
    }

    await prismaMain.feePaymentAllocation.delete({
      where: { id },
    });

    return null;
  },
};
