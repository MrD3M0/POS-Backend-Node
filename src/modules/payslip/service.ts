import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { PayslipCreateInput } from "./validator";

export const PayslipService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { payslipNo: { contains: query.search, mode: "insensitive" } },
        { employeeId: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [slips, total] = await Promise.all([
      prismaMain.payslip.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          items: true,
          employee: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.payslip.count({ where: whereClause }),
    ]);

    return {
      data: slips,
      pagination: { page, limit, total },
    };
  },

  async create(data: PayslipCreateInput, userId?: string) {
    try {
      const slip = await prismaMain.payslip.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          items: true,
          employee: true,
        },
      });
      return slip;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A payslip already exists with this number", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const slip = await prismaMain.payslip.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: true,
        employee: true,
      },
    });

    if (!slip) {
      throw new CustomError("Payslip not found", 404);
    }

    return slip;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.payslip.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Payslip not found", 404);
    }

    await prismaMain.payslip.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
