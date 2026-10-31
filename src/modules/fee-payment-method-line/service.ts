import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { FeePaymentMethodLineCreateInput } from "./validator";

export const FeePaymentMethodLineService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

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
        take: limit,
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

  async create(data: FeePaymentMethodLineCreateInput, userId?: string) {
    try {
      const line = await prismaMain.feePaymentMethodLine.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          paymentMethod: true,
        },
      });
      return line;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A payment method line already exists for this payment", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const line = await prismaMain.feePaymentMethodLine.findFirst({
      where: { id, deletedAt: null },
      include: {
        paymentMethod: true,
      },
    });

    if (!line) {
      throw new CustomError("Fee payment method line not found", 404);
    }

    return line;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.feePaymentMethodLine.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Fee payment method line not found", 404);
    }

    await prismaMain.feePaymentMethodLine.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
