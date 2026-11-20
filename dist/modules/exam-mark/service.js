"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamMarkService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const safe_select_1 = require("@/utils/safe-select");
const CustomError_1 = require("@/errors/CustomError");
/**
 * Validates one mark row and enforces:
 * - exam subject + student exist; student belongs to the exam's batch
 * - isAbsent=true  => marksObtained = null (per DECISIONS.md: absent counts as FAIL)
 * - marksObtained <= fullMarks (and >= 0)
 */
async function validateMark(data) {
    const examSubject = await prismaClient_1.prismaMain.examSubject.findFirst({
        where: { id: data.examSubjectId, deletedAt: null },
        include: { exam: { include: { batchTerm: true } } },
    });
    if (!examSubject)
        throw new CustomError_1.CustomError("Exam subject not found", 404);
    const student = await prismaClient_1.prismaMain.student.findFirst({
        where: { id: data.studentId, deletedAt: null },
    });
    if (!student)
        throw new CustomError_1.CustomError("Student not found", 404);
    if (student.batchId !== examSubject.exam.batchTerm.batchId) {
        throw new CustomError_1.CustomError("Student does not belong to the batch of this exam", 422);
    }
    const isAbsent = data.isAbsent ?? false;
    const fullMarks = Number(examSubject.fullMarks);
    if (isAbsent)
        return { marksObtained: null, isAbsent: true, fullMarks };
    if (data.marksObtained === undefined || data.marksObtained === null) {
        throw new CustomError_1.CustomError("marksObtained is required when isAbsent is false", 400);
    }
    const marks = Number(data.marksObtained);
    if (!Number.isFinite(marks))
        throw new CustomError_1.CustomError("marksObtained must be a number", 400);
    if (marks < 0)
        throw new CustomError_1.CustomError("marksObtained cannot be negative", 400);
    if (marks > fullMarks) {
        throw new CustomError_1.CustomError(`marksObtained (${marks}) exceeds full marks (${fullMarks})`, 422);
    }
    return { marksObtained: String(marks), isAbsent: false, fullMarks };
}
exports.ExamMarkService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = { deletedAt: null };
        if (query.examSubjectId)
            whereClause.examSubjectId = query.examSubjectId;
        if (query.studentId)
            whereClause.studentId = query.studentId;
        const [marks, total] = await Promise.all([
            prismaClient_1.prismaMain.examMark.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: { student: { select: safe_select_1.STUDENT_SAFE_SELECT } },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.examMark.count({ where: whereClause }),
        ]);
        return { data: marks, pagination: { page, limit, total } };
    },
    async create(data, userId) {
        const validated = await validateMark(data);
        const existing = await prismaClient_1.prismaMain.examMark.findFirst({
            where: {
                examSubjectId: data.examSubjectId,
                studentId: data.studentId,
                deletedAt: null,
            },
        });
        if (existing) {
            throw new CustomError_1.CustomError("An exam mark already exists for this student and subject", 409);
        }
        try {
            return await prismaClient_1.prismaMain.examMark.create({
                data: {
                    examSubjectId: data.examSubjectId,
                    studentId: data.studentId,
                    marksObtained: validated.marksObtained,
                    isAbsent: validated.isAbsent,
                    remarks: data.remarks ?? null,
                    createdBy: userId,
                },
                include: { student: { select: safe_select_1.STUDENT_SAFE_SELECT } },
            });
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("An exam mark already exists for this student and subject", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const mark = await prismaClient_1.prismaMain.examMark.findFirst({
            where: { id, deletedAt: null },
            include: { student: { select: safe_select_1.STUDENT_SAFE_SELECT } },
        });
        if (!mark)
            throw new CustomError_1.CustomError("Exam mark not found", 404);
        return mark;
    },
    /** Bulk upsert: every row is validated first, then written in one transaction. */
    async bulkCreate(data, userId) {
        const seen = new Set();
        for (const mark of data.marks) {
            const key = `${mark.examSubjectId}:${mark.studentId}`;
            if (seen.has(key))
                throw new CustomError_1.CustomError(`Duplicate mark in request for ${key}`, 400);
            seen.add(key);
        }
        const validated = await Promise.all(data.marks.map((mark) => validateMark(mark)));
        await prismaClient_1.prismaMain.$transaction(async (tx) => {
            for (let i = 0; i < data.marks.length; i += 1) {
                const mark = data.marks[i];
                const v = validated[i];
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
        return prismaClient_1.prismaMain.examMark.findMany({
            where: {
                OR: data.marks.map((mark) => ({
                    examSubjectId: mark.examSubjectId,
                    studentId: mark.studentId,
                })),
            },
            include: { student: { select: safe_select_1.STUDENT_SAFE_SELECT } },
            orderBy: { createdAt: "asc" },
        });
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.examMark.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Exam mark not found", 404);
        const merged = {
            examSubjectId: data.examSubjectId ?? existing.examSubjectId,
            studentId: data.studentId ?? existing.studentId,
            // when isAbsent flips to true, marks must become null (DECISIONS.md)
            marksObtained: data.isAbsent === true
                ? null
                : data.marksObtained !== undefined
                    ? data.marksObtained
                    : existing.marksObtained === null
                        ? null
                        : String(existing.marksObtained),
            isAbsent: data.isAbsent ?? existing.isAbsent,
        };
        const validated = await validateMark(merged);
        return prismaClient_1.prismaMain.examMark.update({
            where: { id },
            data: {
                examSubjectId: merged.examSubjectId,
                studentId: merged.studentId,
                marksObtained: validated.marksObtained,
                isAbsent: validated.isAbsent,
                ...(data.remarks !== undefined ? { remarks: data.remarks } : {}),
                updatedBy: userId,
            },
            include: { student: { select: safe_select_1.STUDENT_SAFE_SELECT } },
        });
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.examMark.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Exam mark not found", 404);
        await prismaClient_1.prismaMain.examMark.update({
            where: { id },
            data: { deletedAt: new Date(), updatedBy: userId },
        });
        return null;
    },
};
