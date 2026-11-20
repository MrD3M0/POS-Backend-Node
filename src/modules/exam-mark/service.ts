import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { STUDENT_SAFE_SELECT } from "@/utils/safe-select";
import { CustomError } from "@/errors/CustomError";
import {
  ExamMarkBulkInput,
  ExamMarkCreateInput,
  ExamMarkUpdateInput,
} from "./validator";

/**
 * Validates one mark row and enforces:
 * - exam subject + student exist; student belongs to the exam's batch
 * - isAbsent=true  => marksObtained = null (per DECISIONS.md: absent counts as FAIL)
 * - marksObtained <= fullMarks (and >= 0)
 */
async function validateMark(data: {
  examSubjectId: string;
  studentId: string;
  marksObtained?: string | number | null | undefined;
  isAbsent?: boolean;
}): Promise<{
  marksObtained: string | null;
  isAbsent: boolean;
  fullMarks: number;
}> {
  const examSubject = await prismaMain.examSubject.findFirst({
    where: { id: data.examSubjectId, deletedAt: null },
    include: { exam: { include: { batchTerm: true } } },
  });
  if (!examSubject) throw new CustomError("Exam subject not found", 404);

  const student = await prismaMain.student.findFirst({
    where: { id: data.studentId, deletedAt: null },
  });
  if (!student) throw new CustomError("Student not found", 404);
  if (student.batchId !== examSubject.exam.batchTerm.batchId) {
    throw new CustomError(
      "Student does not belong to the batch of this exam",
      422,
    );
  }

  const isAbsent = data.isAbsent ?? false;
  const fullMarks = Number(examSubject.fullMarks);

  if (isAbsent) return { marksObtained: null, isAbsent: true, fullMarks };

  if (data.marksObtained === undefined || data.marksObtained === null) {
    throw new CustomError(
      "marksObtained is required when isAbsent is false",
      400,
    );
  }
  const marks = Number(data.marksObtained);
  if (!Number.isFinite(marks))
    throw new CustomError("marksObtained must be a number", 400);
  if (marks < 0) throw new CustomError("marksObtained cannot be negative", 400);
  if (marks > fullMarks) {
    throw new CustomError(
      `marksObtained (${marks}) exceeds full marks (${fullMarks})`,
      422,
    );
  }
  return { marksObtained: String(marks), isAbsent: false, fullMarks };
}

export const ExamMarkService = {
  async index(query: {
    page?: number;
    limit?: number;
    search?: string;
    examSubjectId?: string;
    studentId?: string;
  }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: any = { deletedAt: null };
    if (query.examSubjectId) whereClause.examSubjectId = query.examSubjectId;
    if (query.studentId) whereClause.studentId = query.studentId;

    const [marks, total] = await Promise.all([
      prismaMain.examMark.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: { student: { select: STUDENT_SAFE_SELECT } },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.examMark.count({ where: whereClause }),
    ]);

    return { data: marks, pagination: { page, limit, total } };
  },

  async create(data: ExamMarkCreateInput, userId?: string) {
    const validated = await validateMark(data);

    const existing = await prismaMain.examMark.findFirst({
      where: {
        examSubjectId: data.examSubjectId,
        studentId: data.studentId,
        deletedAt: null,
      },
    });
    if (existing) {
      throw new CustomError(
        "An exam mark already exists for this student and subject",
        409,
      );
    }

    try {
      return await prismaMain.examMark.create({
        data: {
          examSubjectId: data.examSubjectId,
          studentId: data.studentId,
          marksObtained: validated.marksObtained,
          isAbsent: validated.isAbsent,
          remarks: data.remarks ?? null,
          createdBy: userId,
        },
        include: { student: { select: STUDENT_SAFE_SELECT } },
      });
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError(
          "An exam mark already exists for this student and subject",
          409,
        );
      }
      throw error;
    }
  },

  async getById(id: string) {
    const mark = await prismaMain.examMark.findFirst({
      where: { id, deletedAt: null },
      include: { student: { select: STUDENT_SAFE_SELECT } },
    });
    if (!mark) throw new CustomError("Exam mark not found", 404);
    return mark;
  },

  /** Bulk upsert: every row is validated first, then written in one transaction. */
  async bulkCreate(data: ExamMarkBulkInput, userId?: string) {
    const seen = new Set<string>();
    for (const mark of data.marks) {
      const key = `${mark.examSubjectId}:${mark.studentId}`;
      if (seen.has(key))
        throw new CustomError(`Duplicate mark in request for ${key}`, 400);
      seen.add(key);
    }

    const validated = await Promise.all(
      data.marks.map((mark) => validateMark(mark)),
    );

    await prismaMain.$transaction(async (tx) => {
      for (let i = 0; i < data.marks.length; i += 1) {
        const mark = data.marks[i] as ExamMarkCreateInput;
        const v = validated[i] as {
          marksObtained: string | null;
          isAbsent: boolean;
        };
        await tx.examMark.upsert({
          where: {
            examSubjectId_studentId: {
              examSubjectId: mark.examSubjectId,
              studentId: mark.studentId,
            },
          },
          create: {
            examSubjectId: mark.examSubjectId,
            studentId: mark.studentId,
            marksObtained: v.marksObtained,
            isAbsent: v.isAbsent,
            remarks: mark.remarks ?? null,
            createdBy: userId,
          },
          update: {
            marksObtained: v.marksObtained,
            isAbsent: v.isAbsent,
            remarks: mark.remarks ?? null,
            deletedAt: null,
            updatedBy: userId,
          },
        });
      }
    });

    return prismaMain.examMark.findMany({
      where: {
        OR: data.marks.map((mark) => ({
          examSubjectId: mark.examSubjectId,
          studentId: mark.studentId,
        })),
      },
      include: { student: { select: STUDENT_SAFE_SELECT } },
      orderBy: { createdAt: "asc" },
    });
  },

  async update(id: string, data: ExamMarkUpdateInput, userId?: string) {
    const existing = await prismaMain.examMark.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new CustomError("Exam mark not found", 404);

    const merged = {
      examSubjectId: data.examSubjectId ?? existing.examSubjectId,
      studentId: data.studentId ?? existing.studentId,
      // when isAbsent flips to true, marks must become null (DECISIONS.md)
      marksObtained:
        data.isAbsent === true
          ? null
          : data.marksObtained !== undefined
            ? data.marksObtained
            : existing.marksObtained === null
              ? null
              : String(existing.marksObtained),
      isAbsent: data.isAbsent ?? existing.isAbsent,
    };
    const validated = await validateMark(merged as any);

    return prismaMain.examMark.update({
      where: { id },
      data: {
        examSubjectId: merged.examSubjectId,
        studentId: merged.studentId,
        marksObtained: validated.marksObtained,
        isAbsent: validated.isAbsent,
        ...(data.remarks !== undefined ? { remarks: data.remarks } : {}),
        updatedBy: userId,
      },
      include: { student: { select: STUDENT_SAFE_SELECT } },
    });
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.examMark.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new CustomError("Exam mark not found", 404);
    await prismaMain.examMark.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
    return null;
  },
};
