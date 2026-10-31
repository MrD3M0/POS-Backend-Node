import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { FeeInstallmentCreateInput } from "./validator";

export const FeeInstallmentService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

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
        take: limit,
        include: {
          studentFee: true,
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

  async create(data: FeeInstallmentCreateInput, userId?: string) {
    try {
      const installment = await prismaMain.feeInstallment.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          studentFee: true,
        },
      });
      return installment;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("An installment already exists for this student fee item", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const installment = await prismaMain.feeInstallment.findFirst({
      where: { id, deletedAt: null },
      include: {
        studentFee: true,
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
    });

    if (!existing) {
      throw new CustomError("Fee installment not found", 404);
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
