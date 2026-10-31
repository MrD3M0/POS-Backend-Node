import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { TeachingAssignmentCreateInput } from "./validator";

export const TeachingAssignmentService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { teacherId: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [assignments, total] = await Promise.all([
      prismaMain.teachingAssignment.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          attendances: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.teachingAssignment.count({ where: whereClause }),
    ]);

    return {
      data: assignments,
      pagination: { page, limit, total },
    };
  },

  async create(data: TeachingAssignmentCreateInput, userId?: string) {
    try {
      const assignment = await prismaMain.teachingAssignment.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          attendances: true,
        },
      });
      return assignment;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A teaching assignment with this subject already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const assignment = await prismaMain.teachingAssignment.findFirst({
      where: { id, deletedAt: null },
      include: {
        attendances: true,
      },
    });

    if (!assignment) {
      throw new CustomError("Teaching assignment not found", 404);
    }

    return assignment;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.teachingAssignment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Teaching assignment not found", 404);
    }

    await prismaMain.teachingAssignment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
