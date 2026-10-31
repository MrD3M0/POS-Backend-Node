import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { FeePaymentCreateInput } from "./validator";

export const FeePaymentService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { receiptNo: { contains: query.search, mode: "insensitive" } },
        { studentId: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [payments, total] = await Promise.all([
      prismaMain.feePayment.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          allocations: true,
          methodLines: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.feePayment.count({ where: whereClause }),
    ]);

    return {
      data: payments,
      pagination: { page, limit, total },
    };
  },

  async create(data: FeePaymentCreateInput, userId?: string) {
    try {
      const payment = await prismaMain.feePayment.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          allocations: true,
          methodLines: true,
        },
      });
      return payment;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A fee payment already exists for this student and year", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const payment = await prismaMain.feePayment.findFirst({
      where: { id, deletedAt: null },
      include: {
        allocations: true,
        methodLines: true,
      },
    });

    if (!payment) {
      throw new CustomError("Fee payment not found", 404);
    }

    return payment;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.feePayment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Fee payment not found", 404);
    }

    await prismaMain.feePayment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
