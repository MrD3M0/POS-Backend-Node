"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
const audit_1 = require("@/lib/audit");
exports.BatchService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {
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
            prismaClient_1.prismaMain.batch.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    course: { select: { id: true, code: true, name: true, totalTerms: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.batch.count({ where: whereClause }),
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
    async create(data, userId) {
        // Validate that Course exists and is not soft-deleted
        const course = await prismaClient_1.prismaMain.course.findFirst({
            where: { id: data.courseId, deletedAt: null },
        });
        if (!course) {
            throw new CustomError_1.CustomError("Course not found or has been deleted", 404);
        }
        // Validate that currentTermNumber does not exceed totalTerms
        if (data.currentTermNumber > course.totalTerms) {
            throw new CustomError_1.CustomError(`Current term number (${data.currentTermNumber}) cannot exceed course total terms (${course.totalTerms})`, 400);
        }
        // Check duplicate batch name within the same course
        const existing = await prismaClient_1.prismaMain.batch.findFirst({
            where: {
                courseId: data.courseId,
                name: data.name,
                deletedAt: null,
            },
        });
        if (existing) {
            throw new CustomError_1.CustomError("A batch with this name already exists for this course", 409);
        }
        try {
            // Atomically create the batch plus BatchTerms 1..totalTerms
            // (Semester N / Year N per the course system).
            const batch = await prismaClient_1.prismaMain.$transaction(async (tx) => {
                const created = await tx.batch.create({
                    data: {
                        ...data,
                        createdBy: userId,
                    },
                });
                const termName = (n) => course.system === "SEMESTER" ? `Semester ${n}` : `Year ${n}`;
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
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A batch with this name already exists for this course", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const batch = await prismaClient_1.prismaMain.batch.findFirst({
            where: { id, deletedAt: null },
            include: {
                course: { select: { id: true, code: true, name: true, totalTerms: true } },
                terms: { orderBy: { termNumber: "asc" } },
            },
        });
        if (!batch) {
            throw new CustomError_1.CustomError("Batch not found", 404);
        }
        return batch;
    },
    async update(id, data, userId) {
        const batch = await prismaClient_1.prismaMain.batch.findFirst({
            where: { id, deletedAt: null },
        });
        if (!batch) {
            throw new CustomError_1.CustomError("Batch not found", 404);
        }
        const targetCourseId = data.courseId || batch.courseId;
        // Validate course if changed or referenced
        const course = await prismaClient_1.prismaMain.course.findFirst({
            where: { id: targetCourseId, deletedAt: null },
        });
        if (!course) {
            throw new CustomError_1.CustomError("Course not found or has been deleted", 404);
        }
        const targetTermNumber = data.currentTermNumber !== undefined ? data.currentTermNumber : batch.currentTermNumber;
        if (targetTermNumber > course.totalTerms) {
            throw new CustomError_1.CustomError(`Current term number (${targetTermNumber}) cannot exceed course total terms (${course.totalTerms})`, 400);
        }
        const targetName = data.name !== undefined ? data.name : batch.name;
        if (data.name || data.courseId) {
            const duplicate = await prismaClient_1.prismaMain.batch.findFirst({
                where: {
                    courseId: targetCourseId,
                    name: targetName,
                    NOT: { id },
                    deletedAt: null,
                },
            });
            if (duplicate) {
                throw new CustomError_1.CustomError("A batch with this name already exists for this course", 409);
            }
        }
        try {
            const updated = await prismaClient_1.prismaMain.batch.update({
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
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A batch with this name already exists for this course", 409);
            }
            throw error;
        }
    },
    async delete(id, userId) {
        const batch = await prismaClient_1.prismaMain.batch.findFirst({
            where: { id, deletedAt: null },
            include: { _count: { select: { students: true, terms: true, feeStructures: true } } },
        });
        if (!batch) {
            throw new CustomError_1.CustomError("Batch not found", 404);
        }
        if (batch._count.students > 0) {
            throw new CustomError_1.CustomError(`Used by ${batch._count.students} students; deactivate the batch instead`, 409);
        }
        await prismaClient_1.prismaMain.batch.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
    async promote(id, userId) {
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            const batch = await tx.batch.findFirst({
                where: { id, deletedAt: null },
                include: { course: { select: { id: true, code: true, name: true, totalTerms: true } }, terms: { where: { deletedAt: null }, orderBy: { termNumber: "asc" } } },
            });
            if (!batch)
                throw new CustomError_1.CustomError("Batch not found", 404);
            const totalTerms = batch.course?.totalTerms ?? 0;
            if (batch.currentTermNumber >= totalTerms) {
                throw new CustomError_1.CustomError(`Batch is already at its last term (${totalTerms}). Use Graduate batch instead`, 409);
            }
            const nextTerm = batch.currentTermNumber + 1;
            const nextTermRow = batch.terms.find((term) => term.termNumber === nextTerm);
            if (!nextTermRow) {
                throw new CustomError_1.CustomError(`Term ${nextTerm} does not exist for this batch`, 409);
            }
            const updated = await tx.batch.update({
                where: { id },
                data: { currentTermNumber: nextTerm, updatedBy: userId },
                include: { course: { select: { id: true, code: true, name: true, totalTerms: true } }, terms: { where: { deletedAt: null }, orderBy: { termNumber: "asc" } } },
            });
            await (0, audit_1.writeAudit)(tx, {
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
    async graduate(id, reason, userId) {
        if (!reason)
            throw new CustomError_1.CustomError("A reason is required to graduate a batch", 400);
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            const batch = await tx.batch.findFirst({
                where: { id, deletedAt: null },
                select: { id: true, name: true, courseId: true, isActive: true, currentTermNumber: true, course: { select: { id: true, code: true, name: true, totalTerms: true } } },
            });
            if (!batch)
                throw new CustomError_1.CustomError("Batch not found", 404);
            const totalTerms = batch.course?.totalTerms ?? 0;
            if (batch.currentTermNumber < totalTerms) {
                throw new CustomError_1.CustomError(`Batch can only be graduated after the last term (${batch.currentTermNumber}/${totalTerms})`, 409);
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
            await (0, audit_1.writeAudit)(tx, {
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
