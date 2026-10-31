import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { LeaveTypeCreateInput } from "./validator";

export const LeaveTypeService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (query.search) {
      whereClause.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [leaveTypes, total] = await Promise.all([
      prismaMain.leaveType.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.leaveType.count({ where: whereClause }),
    ]);

    return {
      data: leaveTypes,
      pagination: { page, limit, total },
    };
  },

  async create(data: LeaveTypeCreateInput, userId?: string) {
    try {
      const leaveType = await prismaMain.leaveType.create({
        data: {
          ...data,
          createdBy: userId,
        },
      });
      return leaveType;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A leave type with this name already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const leaveType = await prismaMain.leaveType.findFirst({
      where: { id, deletedAt: null },
    });

    if (!leaveType) {
      throw new CustomError("Leave type not found", 404);
    }

    return leaveType;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.leaveType.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Leave type not found", 404);
    }

    await prismaMain.leaveType.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
