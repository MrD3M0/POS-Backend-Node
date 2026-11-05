import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { PayslipItemCreateInput } from "./validator";

export const PayslipItemService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (query.search) {
      whereClause.OR = [
        { componentId: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prismaMain.payslipItem.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          component: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.payslipItem.count({ where: whereClause }),
    ]);

    return {
      data: items,
      pagination: { page, limit, total },
    };
  },

  async create(data: PayslipItemCreateInput, userId?: string) {
    try {
      const item = await prismaMain.payslipItem.create({
        data: {
          ...data,
          payslipId: data.payslipId,
          createdBy: userId,
        },
        include: {
          component: true,
        },
      });
      return item;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A payslip item already exists for this payslip and component", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const item = await prismaMain.payslipItem.findFirst({
      where: { id },
      include: {
        component: true,
      },
    });

    if (!item) {
      throw new CustomError("Payslip item not found", 404);
    }

    return item;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.payslipItem.findFirst({
      where: { id },
    });

    if (!existing) {
      throw new CustomError("Payslip item not found", 404);
    }

    await prismaMain.payslipItem.delete({
      where: { id },
    });

    return null;
  },
};
