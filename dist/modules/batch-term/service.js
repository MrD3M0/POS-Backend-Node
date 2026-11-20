"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchTermService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
exports.BatchTermService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {
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
            prismaClient_1.prismaMain.batchTerm.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    batch: { select: { id: true, name: true, courseId: true, currentTermNumber: true, course: { select: { id: true, code: true, name: true, totalTerms: true, system: true } } } },
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.batchTerm.count({ where: whereClause }),
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
    async create(data, userId) {
        // Validate that Batch exists and is not soft-deleted
        const batch = await prismaClient_1.prismaMain.batch.findFirst({
            where: { id: data.batchId, deletedAt: null },
        });
        if (!batch) {
            throw new CustomError_1.CustomError("Batch not found or has been deleted", 404);
        }
        // Check duplicate term number within the same batch
        const existing = await prismaClient_1.prismaMain.batchTerm.findFirst({
            where: {
                batchId: data.batchId,
                termNumber: data.termNumber,
                deletedAt: null,
            },
        });
        if (existing) {
            throw new CustomError_1.CustomError("A term with this number already exists for this batch", 409);
        }
        // Validate term number does not exceed course total terms
        const course = await prismaClient_1.prismaMain.course.findFirst({
            where: { id: batch.courseId, deletedAt: null },
        });
        if (!course) {
            throw new CustomError_1.CustomError("Course not found for this batch", 404);
        }
        if (data.termNumber > course.totalTerms) {
            throw new CustomError_1.CustomError(`Term number (${data.termNumber}) cannot exceed course total terms (${course.totalTerms})`, 400);
        }
        try {
            const batchTerm = await prismaClient_1.prismaMain.batchTerm.create({
                data: {
                    ...data,
                    ...(userId && { createdBy: userId }),
                },
                include: {
                    batch: { select: { id: true, name: true, courseId: true, currentTermNumber: true, course: { select: { id: true, code: true, name: true, totalTerms: true, system: true } } } },
                },
            });
            return batchTerm;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A term with this number already exists for this batch", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const batchTerm = await prismaClient_1.prismaMain.batchTerm.findFirst({
            where: { id, deletedAt: null },
            include: {
                batch: { select: { id: true, name: true, courseId: true, currentTermNumber: true, course: { select: { id: true, code: true, name: true, totalTerms: true, system: true } } } },
                subjects: true,
                exams: true,
            },
        });
        if (!batchTerm) {
            throw new CustomError_1.CustomError("BatchTerm not found", 404);
        }
        return batchTerm;
    },
    async update(id, data, userId) {
        const batchTerm = await prismaClient_1.prismaMain.batchTerm.findFirst({
            where: { id, deletedAt: null },
        });
        if (!batchTerm) {
            throw new CustomError_1.CustomError("BatchTerm not found", 404);
        }
        // Validate batch if changed
        if (data.batchId && data.batchId !== batchTerm.batchId) {
            const batch = await prismaClient_1.prismaMain.batch.findFirst({
                where: { id: data.batchId, deletedAt: null },
            });
            if (!batch) {
                throw new CustomError_1.CustomError("Batch not found or has been deleted", 404);
            }
        }
        // Check duplicate term number if changed
        if (data.termNumber !== undefined && data.termNumber !== batchTerm.termNumber) {
            const targetBatchId = data.batchId || batchTerm.batchId;
            const duplicate = await prismaClient_1.prismaMain.batchTerm.findFirst({
                where: {
                    batchId: targetBatchId,
                    termNumber: data.termNumber,
                    NOT: { id },
                    deletedAt: null,
                },
            });
            if (duplicate) {
                throw new CustomError_1.CustomError("A term with this number already exists for this batch", 409);
            }
        }
        try {
            const updated = await prismaClient_1.prismaMain.batchTerm.update({
                where: { id },
                data: {
                    ...data,
                    updatedBy: userId,
                },
                include: {
                    batch: { select: { id: true, name: true, courseId: true, currentTermNumber: true, course: { select: { id: true, code: true, name: true, totalTerms: true, system: true } } } },
                },
            });
            return updated;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A term with this number already exists for this batch", 409);
            }
            throw error;
        }
    },
    async delete(id, userId) {
        const batchTerm = await prismaClient_1.prismaMain.batchTerm.findFirst({
            where: { id, deletedAt: null },
        });
        if (!batchTerm) {
            throw new CustomError_1.CustomError("BatchTerm not found", 404);
        }
        await prismaClient_1.prismaMain.batchTerm.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
};
