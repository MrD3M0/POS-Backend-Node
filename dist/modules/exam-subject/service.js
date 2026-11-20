"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamSubjectService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
const EXAM_SUBJECT_INCLUDE = {
    exam: true,
    batchTermSubject: {
        include: {
            subject: true,
            batchTerm: { include: { batch: true } },
            assignments: {
                where: { deletedAt: null },
                include: {
                    teacher: {
                        include: {
                            employee: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    middleName: true,
                                    lastName: true,
                                    employeeCode: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};
exports.ExamSubjectService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {
            deletedAt: null,
        };
        if (query.search) {
            whereClause.OR = [
                { examId: { contains: query.search, mode: "insensitive" } },
                { fullMarks: { contains: query.search, mode: "insensitive" } },
                { passMarks: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [items, total] = await Promise.all([
            prismaClient_1.prismaMain.examSubject.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: EXAM_SUBJECT_INCLUDE,
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.examSubject.count({ where: whereClause }),
        ]);
        return {
            data: items,
            pagination: { page, limit, total },
        };
    },
    async create(data, userId) {
        try {
            const item = await prismaClient_1.prismaMain.examSubject.create({
                data: {
                    ...data,
                    ...(userId && { createdBy: userId }),
                },
                include: EXAM_SUBJECT_INCLUDE,
            });
            return item;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("An exam subject with this exam already exists", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const item = await prismaClient_1.prismaMain.examSubject.findFirst({
            where: { id, deletedAt: null },
            include: EXAM_SUBJECT_INCLUDE,
        });
        if (!item) {
            throw new CustomError_1.CustomError("Exam subject not found", 404);
        }
        return item;
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.examSubject.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Exam subject not found", 404);
        }
        try {
            const updated = await prismaClient_1.prismaMain.examSubject.update({
                where: { id },
                data: {
                    ...data,
                    updatedBy: userId,
                },
                include: EXAM_SUBJECT_INCLUDE,
            });
            return updated;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("An exam subject with this exam already exists", 409);
            }
            throw error;
        }
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.examSubject.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Exam subject not found", 404);
        }
        await prismaClient_1.prismaMain.examSubject.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
};
