import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { PayrollCreateInput } from "./validator";

export const PayrollService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.fiscalYearId = query.search;
    }

    const [records, total] = await Promise.all([
      prismaMain.payroll.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          payslips: true,
          journalEntry: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.payroll.count({ where: whereClause }),
    ]);

    return {
      data: records,
      pagination: { page, limit, total },
    };
  },

  async create(data: PayrollCreateInput, userId?: string) {
    // Validate fiscal year exists and not soft-deleted
    const year = await prismaMain.fiscalYear.findFirst({
      where: { id: data.fiscalYearId, deletedAt: null },
    });
    if (!year) {
      throw new CustomError("Fiscal year not found", 404);
    }

    try {
      const record = await prismaMain.payroll.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          payslips: true,
          journalEntry: true,
        },
      });
      return record;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A payroll already exists for this fiscal year, year and month", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const record = await prismaMain.payroll.findFirst({
      where: { id, deletedAt: null },
      include: {
        payslips: true,
        journalEntry: true,
      },
    });

    if (!record) {
      throw new CustomError("Payroll not found", 404);
    }

    return record;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.payroll.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Payroll not found", 404);
    }

    await prismaMain.payroll.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
