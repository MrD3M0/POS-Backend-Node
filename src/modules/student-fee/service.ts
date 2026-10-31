import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { StudentFeeCreateInput } from "./validator";

export const StudentFeeService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { studentId: { contains: query.search, mode: "insensitive" } },
        { feeStructureId: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [fees, total] = await Promise.all([
      prismaMain.studentFee.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          items: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.studentFee.count({ where: whereClause }),
    ]);

    return {
      data: fees,
      pagination: { page, limit, total },
    };
  },

  async create(data: StudentFeeCreateInput, userId?: string) {
    try {
      const fee = await prismaMain.studentFee.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          items: true,
        },
      });
      return fee;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A student fee already exists for this student and structure", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const fee = await prismaMain.studentFee.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: true,
      },
    });

    if (!fee) {
      throw new CustomError("Student fee not found", 404);
    }

    return fee;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.studentFee.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Student fee not found", 404);
    }

    await prismaMain.studentFee.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
