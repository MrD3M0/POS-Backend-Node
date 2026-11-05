import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { BatchTermCreateInput, BatchTermUpdateInput } from "./validator";

export const BatchTermService = {
  async index(query: { page?: number; limit?: number; search?: string; batchId?: string; isActive?: boolean }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.name = { contains: query.search, mode: "insensitive" };
    }

    if (query.batchId) {
      whereClause.batchId = query.batchId;
    }

    if (query.isActive !== undefined) {
      whereClause.isActive = query.isActive;
    }

    const [batchTerms, total] = await Promise.all([
      prismaMain.batchTerm.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          batch: { include: { course: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.batchTerm.count({ where: whereClause }),
    ]);

    return {
      batchTerms,
      pagination: {
        page,
        limit,
        total,
      },
    };
  },

  async create(data: BatchTermCreateInput, userId?: string) {
    // Validate that Batch exists and is not soft-deleted
    const batch = await prismaMain.batch.findFirst({
      where: { id: data.batchId, deletedAt: null },
    });

    if (!batch) {
      throw new CustomError("Batch not found or has been deleted", 404);
    }

    // Check duplicate term number within the same batch
    const existing = await prismaMain.batchTerm.findFirst({
      where: {
        batchId: data.batchId,
        termNumber: data.termNumber,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new CustomError("A term with this number already exists for this batch", 409);
    }

    // Validate term number does not exceed course total terms
    const course = await prismaMain.course.findFirst({
      where: { id: batch.courseId, deletedAt: null },
    });

    if (!course) {
      throw new CustomError("Course not found for this batch", 404);
    }

    if (data.termNumber > course.totalTerms) {
      throw new CustomError(
        `Term number (${data.termNumber}) cannot exceed course total terms (${course.totalTerms})`,
        400,
      );
    }

    try {
      const batchTerm = await prismaMain.batchTerm.create({
        data: {
          ...data,
          ...(userId && { createdBy: userId }),
        },
        include: {
          batch: { include: { course: true } },
        } as any,
      });
      return batchTerm;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A term with this number already exists for this batch", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const batchTerm = await prismaMain.batchTerm.findFirst({
      where: { id, deletedAt: null },
      include: {
        batch: { include: { course: true } },
        subjects: true,
        exams: true,
      },
    });

    if (!batchTerm) {
      throw new CustomError("BatchTerm not found", 404);
    }

    return batchTerm;
  },

  async update(id: string, data: BatchTermUpdateInput, userId?: string) {
    const batchTerm = await prismaMain.batchTerm.findFirst({
      where: { id, deletedAt: null },
    });

    if (!batchTerm) {
      throw new CustomError("BatchTerm not found", 404);
    }

    // Validate batch if changed
    if (data.batchId && data.batchId !== batchTerm.batchId) {
      const batch = await prismaMain.batch.findFirst({
        where: { id: data.batchId, deletedAt: null },
      });
      if (!batch) {
        throw new CustomError("Batch not found or has been deleted", 404);
      }
    }

    // Check duplicate term number if changed
    if (data.termNumber !== undefined && data.termNumber !== batchTerm.termNumber) {
      const targetBatchId = data.batchId || batchTerm.batchId;
      const duplicate = await prismaMain.batchTerm.findFirst({
        where: {
          batchId: targetBatchId,
          termNumber: data.termNumber,
          NOT: { id },
          deletedAt: null,
        },
      });

      if (duplicate) {
        throw new CustomError("A term with this number already exists for this batch", 409);
      }
    }

    try {
      const updated = await prismaMain.batchTerm.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        },
        include: {
          batch: { include: { course: true } },
        },
      });
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A term with this number already exists for this batch", 409);
      }
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const batchTerm = await prismaMain.batchTerm.findFirst({
      where: { id, deletedAt: null },
    });

    if (!batchTerm) {
      throw new CustomError("BatchTerm not found", 404);
    }

    await prismaMain.batchTerm.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};