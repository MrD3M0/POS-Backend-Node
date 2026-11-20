"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultSubjectService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
exports.ResultSubjectService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {};
        if (query.resultId) {
            whereClause.resultId = query.resultId;
        }
        if (query.search) {
            whereClause.OR = [
                {
                    examSubject: {
                        batchTermSubject: {
                            subject: {
                                name: { contains: query.search, mode: "insensitive" },
                            },
                        },
                    },
                },
                {
                    result: { remarks: { contains: query.search, mode: "insensitive" } },
                },
            ];
        }
        const [resultSubjects, total] = await Promise.all([
            prismaClient_1.prismaMain.resultSubject.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    examSubject: {
                        include: { batchTermSubject: { include: { subject: true } } },
                    },
                    gradeScale: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.resultSubject.count({ where: whereClause }),
        ]);
        return {
            resultSubjects,
            pagination: {
                page,
                limit,
                total,
            },
        };
    },
    async create(data, userId) {
        // Validate exam subject exists
        const examSubject = await prismaClient_1.prismaMain.examSubject.findFirst({
            where: { id: data.examSubjectId, deletedAt: null },
        });
        if (!examSubject) {
            throw new CustomError_1.CustomError("Exam subject not found or has been deleted", 404);
        }
        // Validate result exists
        const result = await prismaClient_1.prismaMain.result.findFirst({
            where: { id: data.resultId, deletedAt: null },
        });
        if (!result) {
            throw new CustomError_1.CustomError("Result not found or has been deleted", 404);
        }
        // Validate grade scale exists
        const gradeScale = await prismaClient_1.prismaMain.gradeScale.findFirst({
            where: { id: data.gradeScaleId, deletedAt: null },
        });
        if (!gradeScale) {
            throw new CustomError_1.CustomError("Grade scale not found or inactive", 404);
        }
        try {
            const resultSubject = await prismaClient_1.prismaMain.resultSubject.create({
                data: {
                    ...data,
                    createdBy: userId,
                },
                include: {
                    examSubject: {
                        include: { batchTermSubject: { include: { subject: true } } },
                    },
                    gradeScale: true,
                },
            });
            return resultSubject;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A result subject already exists for this exam subject", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const resultSubject = await prismaClient_1.prismaMain.resultSubject.findFirst({
            where: { id, deletedAt: null },
            include: {
                examSubject: {
                    include: { batchTermSubject: { include: { subject: true } } },
                },
                gradeScale: true,
            },
        });
        if (!resultSubject) {
            throw new CustomError_1.CustomError("Result subject not found", 404);
        }
        return resultSubject;
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.resultSubject.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Result subject not found", 404);
        }
        try {
            const updated = await prismaClient_1.prismaMain.resultSubject.update({
                where: { id },
                data: {
                    ...data,
                    updatedBy: userId,
                },
                include: {
                    examSubject: {
                        include: { batchTermSubject: { include: { subject: true } } },
                    },
                    gradeScale: true,
                },
            });
            return updated;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A result subject already exists for this exam subject", 409);
            }
            throw error;
        }
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.resultSubject.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Result subject not found", 404);
        }
        await prismaClient_1.prismaMain.resultSubject.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
};
