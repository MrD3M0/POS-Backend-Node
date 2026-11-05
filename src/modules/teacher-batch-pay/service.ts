import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { TeacherBatchPayCreateInput, TeacherBatchPayUpdateInput } from "./validator";

export const TeacherBatchPayService = {
  async index(query: { page?: number; limit?: number; search?: string; teachingAssignmentId?: string; isActive?: boolean }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (query.search) {
      whereClause.teachingAssignmentId = {
        contains: query.search,
        mode: "insensitive",
      };
    }

    if (query.teachingAssignmentId) {
      whereClause.teachingAssignmentId = query.teachingAssignmentId;
    }

    if (query.isActive !== undefined) {
      whereClause.effectiveFromBs = query.isActive
        ? { gte: new Date(new Date().toISOString()) }
        : { lt: new Date(new Date().toISOString()) };
    }

    const [pays, total] = await Promise.all([
      prismaMain.teacherBatchPay.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          teachingAssignment: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.teacherBatchPay.count({ where: whereClause }),
    ]);

    return {
      pays,
      pagination: {
        page,
        limit,
        total,
      },
    };
  },

  async create(data: TeacherBatchPayCreateInput, userId?: string) {
    // Validate teachingAssignment exists and is not soft-deleted
    const assignment = await prismaMain.teachingAssignment.findFirst({
      where: { id: data.teachingAssignmentId, deletedAt: null },
    });

    if (!assignment) {
      throw new CustomError("Teaching assignment not found or has been deleted", 404);
    }

    try {
      const pay = await prismaMain.teacherBatchPay.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          teachingAssignment: true,
        },
      });
      return pay;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("Duplicate entry found", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const pay = await prismaMain.teacherBatchPay.findFirst({
      where: { id, deletedAt: null },
      include: {
        teachingAssignment: true,
      },
    });

    if (!pay) {
      throw new CustomError("Teacher batch pay not found", 404);
    }

    return pay;
  },

  async update(id: string, data: TeacherBatchPayUpdateInput, userId?: string) {
    const pay = await prismaMain.teacherBatchPay.findFirst({
      where: { id, deletedAt: null },
    });

    if (!pay) {
      throw new CustomError("Teacher batch pay not found", 404);
    }

    try {
      const updated = await prismaMain.teacherBatchPay.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        },
        include: {
          teachingAssignment: true,
        },
      });
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("Duplicate entry found", 409);
      }
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const pay = await prismaMain.teacherBatchPay.findFirst({
      where: { id, deletedAt: null },
    });

    if (!pay) {
      throw new CustomError("Teacher batch pay not found", 404);
    }

    await prismaMain.teacherBatchPay.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};