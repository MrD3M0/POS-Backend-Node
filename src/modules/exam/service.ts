import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import { ExamCreateInput, ExamUpdateInput } from "./validator";

// Note: Exam has no direct examMarks relation (marks hang off ExamSubject),
// so includes below intentionally only reference real relations.
const EXAM_INCLUDE = {
  subjects: { include: { batchTermSubject: { include: { subject: true } } } },
  batchTerm: true,
  examType: true,
} as const;

/** Auto-creates ExamSubjects (fullMarks 100, passMarks 40) for every subject of the batch term. */
export async function ensureExamSubjects(examId: string, batchTermId: string, userId?: string) {
  const batchTermSubjects = await prismaMain.batchTermSubject.findMany({
    where: { batchTermId, deletedAt: null },
    select: { id: true },
  });
  if (batchTermSubjects.length === 0) return;
  await prismaMain.examSubject.createMany({
    data: batchTermSubjects.map((bts) => ({
      examId,
      batchTermSubjectId: bts.id,
      fullMarks: 100,
      passMarks: 40,
      createdBy: userId ?? null,
    })),
    skipDuplicates: true,
  });
}

export const ExamService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: any = { deletedAt: null };
    if (query.search) {
      whereClause.OR = [{ name: { contains: query.search, mode: "insensitive" } }];
    }

    const [exams, total] = await Promise.all([
      prismaMain.exam.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: EXAM_INCLUDE,
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.exam.count({ where: whereClause }),
    ]);

    return { data: exams, pagination: { page, limit, total } };
  },

  async create(data: ExamCreateInput, userId?: string) {
    const [batchTerm, examType] = await Promise.all([
      prismaMain.batchTerm.findFirst({ where: { id: data.batchTermId, deletedAt: null } }),
      prismaMain.examType.findFirst({ where: { id: data.examTypeId, deletedAt: null } }),
    ]);
    if (!batchTerm) throw new CustomError("Batch term not found", 404);
    if (!examType) throw new CustomError("Exam type not found", 404);

    // Exam + its subjects are created in one transaction
    const exam = await prismaMain.$transaction(async (tx) => {
      const created = await tx.exam.create({
        data: {
          batchTermId: data.batchTermId,
          examTypeId: data.examTypeId,
          name: data.name,
          startDateBs: data.startDateBs ?? null,
          endDateBs: data.endDateBs ?? null,
          ...(userId && { createdBy: userId }),
        },
      });
      await ensureExamSubjects(created.id, data.batchTermId, userId);
      return tx.exam.findFirst({ where: { id: created.id }, include: EXAM_INCLUDE });
    });

    if (!exam) throw new CustomError("Failed to create exam", 500);
    return exam;
  },

  async getById(id: string) {
    const exam = await prismaMain.exam.findFirst({
      where: { id, deletedAt: null },
      include: EXAM_INCLUDE,
    });
    if (!exam) throw new CustomError("Exam not found", 404);
    return exam;
  },

  async update(id: string, data: ExamUpdateInput, userId?: string) {
    const existing = await prismaMain.exam.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new CustomError("Exam not found", 404);

    if (data.batchTermId && data.batchTermId !== existing.batchTermId) {
      const batchTerm = await prismaMain.batchTerm.findFirst({
        where: { id: data.batchTermId, deletedAt: null },
      });
      if (!batchTerm) throw new CustomError("Batch term not found", 404);
      // Moving the exam to a new term auto-creates missing exam subjects
      await prismaMain.exam.update({
        where: { id },
        data: { ...data, updatedBy: userId },
      });
      await ensureExamSubjects(id, data.batchTermId, userId);
      return prismaMain.exam.findFirst({ where: { id }, include: EXAM_INCLUDE });
    }

    return prismaMain.exam.update({
      where: { id },
      data: { ...data, updatedBy: userId },
      include: EXAM_INCLUDE,
    });
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.exam.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new CustomError("Exam not found", 404);

    const publishedCount = await prismaMain.result.count({
      where: { examId: id, status: "PUBLISHED", deletedAt: null },
    });
    if (publishedCount > 0) {
      throw new CustomError("Cannot delete an exam with published results", 409);
    }

    await prismaMain.exam.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
    return null;
  },
};
