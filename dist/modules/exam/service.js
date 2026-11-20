"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamService = void 0;
exports.ensureExamSubjects = ensureExamSubjects;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
// Note: Exam has no direct examMarks relation (marks hang off ExamSubject),
// so includes below intentionally only reference real relations.
const EXAM_INCLUDE = {
    subjects: { include: { batchTermSubject: { include: { subject: true } } } },
    batchTerm: true,
    examType: true,
};
/** Auto-creates ExamSubjects (fullMarks 100, passMarks 40) for every subject of the batch term. */
async function ensureExamSubjects(examId, batchTermId, userId) {
    const batchTermSubjects = await prismaClient_1.prismaMain.batchTermSubject.findMany({
        where: { batchTermId, deletedAt: null },
        select: { id: true },
    });
    if (batchTermSubjects.length === 0)
        return;
    await prismaClient_1.prismaMain.examSubject.createMany({
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
exports.ExamService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = { deletedAt: null };
        if (query.search) {
            whereClause.OR = [{ name: { contains: query.search, mode: "insensitive" } }];
        }
        const [exams, total] = await Promise.all([
            prismaClient_1.prismaMain.exam.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: EXAM_INCLUDE,
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.exam.count({ where: whereClause }),
        ]);
        return { data: exams, pagination: { page, limit, total } };
    },
    async create(data, userId) {
        const [batchTerm, examType] = await Promise.all([
            prismaClient_1.prismaMain.batchTerm.findFirst({ where: { id: data.batchTermId, deletedAt: null } }),
            prismaClient_1.prismaMain.examType.findFirst({ where: { id: data.examTypeId, deletedAt: null } }),
        ]);
        if (!batchTerm)
            throw new CustomError_1.CustomError("Batch term not found", 404);
        if (!examType)
            throw new CustomError_1.CustomError("Exam type not found", 404);
        // Exam + its subjects are created in one transaction
        const exam = await prismaClient_1.prismaMain.$transaction(async (tx) => {
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
        if (!exam)
            throw new CustomError_1.CustomError("Failed to create exam", 500);
        return exam;
    },
    async getById(id) {
        const exam = await prismaClient_1.prismaMain.exam.findFirst({
            where: { id, deletedAt: null },
            include: EXAM_INCLUDE,
        });
        if (!exam)
            throw new CustomError_1.CustomError("Exam not found", 404);
        return exam;
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.exam.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Exam not found", 404);
        if (data.batchTermId && data.batchTermId !== existing.batchTermId) {
            const batchTerm = await prismaClient_1.prismaMain.batchTerm.findFirst({
                where: { id: data.batchTermId, deletedAt: null },
            });
            if (!batchTerm)
                throw new CustomError_1.CustomError("Batch term not found", 404);
            // Moving the exam to a new term auto-creates missing exam subjects
            await prismaClient_1.prismaMain.exam.update({
                where: { id },
                data: { ...data, updatedBy: userId },
            });
            await ensureExamSubjects(id, data.batchTermId, userId);
            return prismaClient_1.prismaMain.exam.findFirst({ where: { id }, include: EXAM_INCLUDE });
        }
        return prismaClient_1.prismaMain.exam.update({
            where: { id },
            data: { ...data, updatedBy: userId },
            include: EXAM_INCLUDE,
        });
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.exam.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Exam not found", 404);
        const publishedCount = await prismaClient_1.prismaMain.result.count({
            where: { examId: id, status: "PUBLISHED", deletedAt: null },
        });
        if (publishedCount > 0) {
            throw new CustomError_1.CustomError("Cannot delete an exam with published results", 409);
        }
        await prismaClient_1.prismaMain.exam.update({
            where: { id },
            data: { deletedAt: new Date(), updatedBy: userId },
        });
        return null;
    },
};
