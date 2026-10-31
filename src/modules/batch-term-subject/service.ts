import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { BatchTermSubjectCreateInput, BatchTermSubjectUpdateInput } from "./validator";

export const BatchTermSubjectService = {
  async index(query: { page?: number; limit?: number; search?: string; batchTermId?: string; subjectId?: string; isElective?: boolean }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { subject: { name: { contains: query.search, mode: "insensitive" } } },
        { subject: { code: { contains: query.search, mode: "insensitive" } } },
      ];
    }

    if (query.batchTermId) {
      whereClause.batchTermId = query.batchTermId;
    }

    if (query.subjectId) {
      whereClause.subjectId = query.subjectId;
    }

    if (query.isElective !== undefined) {
      whereClause.isElective = query.isElective;
    }

    const [batchTermSubjects, total] = await Promise.all([
      prismaMain.batchTermSubject.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          subject: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.batchTermSubject.count({ where: whereClause }),
    ]);

    return {
      batchTermSubjects,
      pagination: {
        page,
        limit,
        total,
      },
    };
  },

  async create(data: BatchTermSubjectCreateInput, userId?: string) {
    // Validate that BatchTerm exists and is not soft-deleted
    const batchTerm = await prismaMain.batchTerm.findFirst({
      where: { id: data.batchTermId, deletedAt: null },
    });

    if (!batchTerm) {
      throw new CustomError("BatchTerm not found or has been deleted", 404);
    }

    // Validate that Subject exists and is not soft-deleted
    const subject = await prismaMain.subject.findFirst({
      where: { id: data.subjectId, deletedAt: null },
    });

    if (!subject) {
      throw new CustomError("Subject not found or has been deleted", 404);
    }

    // Check duplicate combination of batchTerm + subject
    const existing = await prismaMain.batchTermSubject.findFirst({
      where: {
        batchTermId: data.batchTermId,
        subjectId: data.subjectId,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new CustomError("This subject is already assigned to this batch term", 409);
    }

    try {
      const batchTermSubject = await prismaMain.batchTermSubject.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          subject: true,
        },
      });
      return batchTermSubject;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("This subject is already assigned to this batch term", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const batchTermSubject = await prismaMain.batchTermSubject.findFirst({
      where: { id, deletedAt: null },
      include: {
        subject: true,
        assignments: true,
        examSubjects: true,
      },
    });

    if (!batchTermSubject) {
      throw new CustomError("BatchTermSubject not found", 404);
    }

    return batchTermSubject;
  },

  async update(id: string, data: BatchTermSubjectUpdateInput, userId?: string) {
    const existing = await prismaMain.batchTermSubject.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("BatchTermSubject not found", 404);
    }

    // Validate batchTerm if changed
    if (data.batchTermId && data.batchTermId !== existing.batchTermId) {
      const batchTerm = await prismaMain.batchTerm.findFirst({
        where: { id: data.batchTermId, deletedAt: null },
      });
      if (!batchTerm) {
        throw new CustomError("BatchTerm not found or has been deleted", 404);
      }
    }

    // Validate subject if changed
    if (data.subjectId && data.subjectId !== existing.subjectId) {
      const subject = await prismaMain.subject.findFirst({
        where: { id: data.subjectId, deletedAt: null },
      });
      if (!subject) {
        throw new CustomError("Subject not found or has been deleted", 404);
      }
    }

    try {
      const updated = await prismaMain.batchTermSubject.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        },
        include: {
          subject: true,
        },
      });
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("This subject is already assigned to this batch term", 409);
      }
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.batchTermSubject.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("BatchTermSubject not found", 404);
    }

    await prismaMain.batchTermSubject.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};