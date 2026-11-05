import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { PaymentMethodCreateInput } from "./validator";

export const PaymentMethodService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (query.search) {
      whereClause.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { code: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [paymentMethods, total] = await Promise.all([
      prismaMain.paymentMethod.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          paymentLines: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.paymentMethod.count({ where: whereClause }),
    ]);

    return {
      data: paymentMethods,
      pagination: { page, limit, total },
    };
  },

  async create(data: PaymentMethodCreateInput, userId?: string) {
    try {
      const paymentMethod = await prismaMain.paymentMethod.create({
        data: {
          ...data,
          createdBy: userId,
        },
      });
      return paymentMethod;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A payment method with this name already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const paymentMethod = await prismaMain.paymentMethod.findFirst({
      where: { id, deletedAt: null },
    });

    if (!paymentMethod) {
      throw new CustomError("Payment method not found", 404);
    }

    return paymentMethod;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.paymentMethod.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Payment method not found", 404);
    }

    await prismaMain.paymentMethod.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
