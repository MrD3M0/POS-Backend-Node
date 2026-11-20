"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
exports.SubjectService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {
            deletedAt: null,
        };
        if (query.search) {
            whereClause.OR = [
                { name: { contains: query.search, mode: "insensitive" } },
                { code: { contains: query.search, mode: "insensitive" } },
            ];
        }
        if (query.isActive !== undefined) {
            whereClause.isActive = query.isActive;
        }
        const [subjects, total] = await Promise.all([
            prismaClient_1.prismaMain.subject.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.subject.count({ where: whereClause }),
        ]);
        return {
            subjects,
            pagination: {
                page,
                limit,
                total,
            },
        };
    },
    async create(data, userId) {
        const existing = await prismaClient_1.prismaMain.subject.findFirst({
            where: { code: data.code, deletedAt: null },
        });
        if (existing) {
            throw new CustomError_1.CustomError("A subject with this code already exists", 409);
        }
        try {
            const subject = await prismaClient_1.prismaMain.subject.create({
                data: {
                    ...data,
                    createdBy: userId,
                },
            });
            return subject;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A subject with this code already exists", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const subject = await prismaClient_1.prismaMain.subject.findFirst({
            where: { id, deletedAt: null },
        });
        if (!subject) {
            throw new CustomError_1.CustomError("Subject not found", 404);
        }
        return subject;
    },
    async update(id, data, userId) {
        const subject = await prismaClient_1.prismaMain.subject.findFirst({
            where: { id, deletedAt: null },
        });
        if (!subject) {
            throw new CustomError_1.CustomError("Subject not found", 404);
        }
        if (data.code && data.code !== subject.code) {
            const duplicate = await prismaClient_1.prismaMain.subject.findFirst({
                where: {
                    code: data.code,
                    NOT: { id },
                    deletedAt: null,
                },
            });
            if (duplicate) {
                throw new CustomError_1.CustomError("A subject with this code already exists", 409);
            }
        }
        try {
            const updated = await prismaClient_1.prismaMain.subject.update({
                where: { id },
                data: {
                    ...data,
                    updatedBy: userId,
                },
            });
            return updated;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A subject with this code already exists", 409);
            }
            throw error;
        }
    },
    async delete(id, userId) {
        const subject = await prismaClient_1.prismaMain.subject.findFirst({
            where: { id, deletedAt: null },
        });
        if (!subject) {
            throw new CustomError_1.CustomError("Subject not found", 404);
        }
        // Subject removal guard: a subject referenced by any batch term
        // syllabus cannot be removed (deactivate it instead).
        const referenced = await prismaClient_1.prismaMain.batchTermSubject.findFirst({
            where: { subjectId: id, deletedAt: null },
            select: { id: true },
        });
        if (referenced) {
            throw new CustomError_1.CustomError("This subject is referenced by a batch term subject and cannot be removed", 409);
        }
        await prismaClient_1.prismaMain.subject.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
};
