import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import { writeAudit } from "@/lib/audit";
import { BatchCreateInput, BatchUpdateInput } from "./validator";

export const BatchService = {
  async index(query: { page?: number; limit?: number; search?: string; courseId?: string; isActive?: boolean }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

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
        take: toPrismaTake(limit),
        include: {
          course: { select: { id: true, code: true, name: true, totalTerms: true } },
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
      // Atomically create the batch plus BatchTerms 1..totalTerms
      // (Semester N / Year N per the course system).
      const batch = await prismaMain.$transaction(async (tx) => {
        const created = await tx.batch.create({
          data: {
            ...data,
            createdBy: userId,
          },
        });

        const termName = (n: number) =>
          course.system === "SEMESTER" ? `Semester ${n}` : `Year ${n}`;
        await tx.batchTerm.createMany({
          data: Array.from({ length: course.totalTerms }, (_, i) => ({
            batchId: created.id,
            termNumber: i + 1,
            name: termName(i + 1),
            createdBy: userId,
          })),
        });

        return tx.batch.findUnique({
          where: { id: created.id },
          include: {
            course: { select: { id: true, code: true, name: true, totalTerms: true } },
            terms: { orderBy: { termNumber: "asc" } },
          },
        });
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
        course: { select: { id: true, code: true, name: true, totalTerms: true } },
        terms: { orderBy: { termNumber: "asc" } },
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
          course: { select: { id: true, code: true, name: true, totalTerms: true } },
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
      include: { _count: { select: { students: true, terms: true, feeStructures: true } } },
    });

    if (!batch) {
      throw new CustomError("Batch not found", 404);
    }
    if (batch._count.students > 0) {
      throw new CustomError(`Used by ${batch._count.students} students; deactivate the batch instead`, 409);
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

  async promote(id: string, userId?: string) {
    return prismaMain.$transaction(async (tx) => {
      const batch = await tx.batch.findFirst({
        where: { id, deletedAt: null },
        include: { course: { select: { id: true, code: true, name: true, totalTerms: true } }, terms: { where: { deletedAt: null }, orderBy: { termNumber: "asc" } } },
      });
      if (!batch) throw new CustomError("Batch not found", 404);

      const totalTerms = batch.course?.totalTerms ?? 0;
      if (batch.currentTermNumber >= totalTerms) {
        throw new CustomError(
          `Batch is already at its last term (${totalTerms}). Use Graduate batch instead`,
          409,
        );
      }

      const nextTerm = batch.currentTermNumber + 1;
      const nextTermRow = batch.terms.find((term) => term.termNumber === nextTerm);
      if (!nextTermRow) {
        throw new CustomError(`Term ${nextTerm} does not exist for this batch`, 409);
      }

      const updated = await tx.batch.update({
        where: { id },
        data: { currentTermNumber: nextTerm, updatedBy: userId },
        include: { course: { select: { id: true, code: true, name: true, totalTerms: true } }, terms: { where: { deletedAt: null }, orderBy: { termNumber: "asc" } } },
      });

      await writeAudit(tx, {
        entity: "Batch",
        entityId: id,
        action: "PROMOTE",
        oldValues: { currentTermNumber: batch.currentTermNumber },
        newValues: { currentTermNumber: nextTerm },
        userId,
      });

      return updated;
    });
  },

  async graduate(id: string, reason: string, userId?: string) {
    if (!reason) throw new CustomError("A reason is required to graduate a batch", 400);

    return prismaMain.$transaction(async (tx) => {
      const batch = await tx.batch.findFirst({
        where: { id, deletedAt: null },
        select: { id: true, name: true, courseId: true, isActive: true, currentTermNumber: true, course: { select: { id: true, code: true, name: true, totalTerms: true } } },
      });
      if (!batch) throw new CustomError("Batch not found", 404);
      const totalTerms = batch.course?.totalTerms ?? 0;
      if (batch.currentTermNumber < totalTerms) {
        throw new CustomError(
          `Batch can only be graduated after the last term (${batch.currentTermNumber}/${totalTerms})`,
          409,
        );
      }

      const students = await tx.student.updateMany({
        where: { batchId: id, deletedAt: null, status: "ACTIVE", approvalStatus: "APPROVED" },
        data: { status: "GRADUATED", updatedBy: userId },
      });
      const updated = await tx.batch.update({
        where: { id },
        data: { isActive: false, updatedBy: userId },
        select: { id: true, name: true, courseId: true, isActive: true, currentTermNumber: true, course: { select: { id: true, code: true, name: true, totalTerms: true } } },
      });

      await writeAudit(tx, {
        entity: "Batch",
        entityId: id,
        action: "GRADUATE",
        oldValues: { isActive: batch.isActive },
        newValues: { isActive: false, studentsGraduated: students.count, reason },
        userId,
      });

      return { ...updated, studentsGraduated: students.count, reason };
    });
  },
};
