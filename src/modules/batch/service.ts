import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { BatchCreateInput, BatchUpdateInput } from "./validator";

export const BatchService = {
  async index(query: { page?: number; limit?: number; search?: string; courseId?: string; isActive?: boolean }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.name = {
        contains: query.search,
        mode: "insensitive",
      };
    }

    if (query.courseId) {
      whereClause.courseId = query.courseId;
    }

    if (query.isActive !== undefined) {
      whereClause.isActive = query.isActive;
    }

    const [batches, total] = await Promise.all([
      prismaMain.batch.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          course: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.batch.count({ where: whereClause }),
    ]);

    return {
      batches,
      pagination: {
        page,
        limit,
        total,
      },
    };
  },

  async create(data: BatchCreateInput, userId?: string) {
    // Validate that Course exists and is not soft-deleted
    const course = await prismaMain.course.findFirst({
      where: { id: data.courseId, deletedAt: null },
    });

    if (!course) {
      throw new CustomError("Course not found or has been deleted", 404);
    }

    // Validate that currentTermNumber does not exceed totalTerms
    if (data.currentTermNumber > course.totalTerms) {
      throw new CustomError(
        `Current term number (${data.currentTermNumber}) cannot exceed course total terms (${course.totalTerms})`,
        400
      );
    }

    // Check duplicate batch name within the same course
    const existing = await prismaMain.batch.findFirst({
      where: {
        courseId: data.courseId,
        name: data.name,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new CustomError("A batch with this name already exists for this course", 409);
    }

    try {
      const batch = await prismaMain.batch.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          course: true,
        },
      });
      return batch;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A batch with this name already exists for this course", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const batch = await prismaMain.batch.findFirst({
      where: { id, deletedAt: null },
      include: {
        course: true,
      },
    });

    if (!batch) {
      throw new CustomError("Batch not found", 404);
    }

    return batch;
  },

  async update(id: string, data: BatchUpdateInput, userId?: string) {
    const batch = await prismaMain.batch.findFirst({
      where: { id, deletedAt: null },
    });

    if (!batch) {
      throw new CustomError("Batch not found", 404);
    }

    const targetCourseId = data.courseId || batch.courseId;

    // Validate course if changed or referenced
    const course = await prismaMain.course.findFirst({
      where: { id: targetCourseId, deletedAt: null },
    });

    if (!course) {
      throw new CustomError("Course not found or has been deleted", 404);
    }

    const targetTermNumber = data.currentTermNumber !== undefined ? data.currentTermNumber : batch.currentTermNumber;
    if (targetTermNumber > course.totalTerms) {
      throw new CustomError(
        `Current term number (${targetTermNumber}) cannot exceed course total terms (${course.totalTerms})`,
        400
      );
    }

    const targetName = data.name !== undefined ? data.name : batch.name;
    if (data.name || data.courseId) {
      const duplicate = await prismaMain.batch.findFirst({
        where: {
          courseId: targetCourseId,
          name: targetName,
          NOT: { id },
          deletedAt: null,
        },
      });

      if (duplicate) {
        throw new CustomError("A batch with this name already exists for this course", 409);
      }
    }

    try {
      const updated = await prismaMain.batch.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        },
        include: {
          course: true,
        },
      });
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A batch with this name already exists for this course", 409);
      }
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const batch = await prismaMain.batch.findFirst({
      where: { id, deletedAt: null },
    });

    if (!batch) {
      throw new CustomError("Batch not found", 404);
    }

    await prismaMain.batch.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
