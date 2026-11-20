"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamTypeService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
exports.ExamTypeService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 50);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = { deletedAt: null };
        if (query.search) {
            whereClause.OR = [
                { name: { contains: query.search, mode: "insensitive" } },
                { code: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [examTypes, total] = await Promise.all([
            prismaClient_1.prismaMain.examType.findMany({ where: whereClause, skip, take: (0, queryFilters_1.toPrismaTake)(limit), orderBy: { createdAt: "desc" } }),
            prismaClient_1.prismaMain.examType.count({ where: whereClause }),
        ]);
        return { data: examTypes, pagination: { page, limit, total } };
    },
    async create(data, userId) {
        try {
            return await prismaClient_1.prismaMain.examType.create({
                data: {
                    code: data.code ?? data.name.trim().toUpperCase().replace(/\s+/g, "_").slice(0, 50),
                    name: data.name,
                    isActive: data.isActive ?? true,
                    createdBy: userId,
                },
            });
        }
        catch (error) {
            if (error?.code === "P2002")
                throw new CustomError_1.CustomError("An exam type with this code or name already exists", 409);
            throw error;
        }
    },
    async getById(id) {
        const examType = await prismaClient_1.prismaMain.examType.findFirst({ where: { id, deletedAt: null } });
        if (!examType)
            throw new CustomError_1.CustomError("Exam type not found", 404);
        return examType;
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.examType.findFirst({ where: { id, deletedAt: null } });
        if (!existing)
            throw new CustomError_1.CustomError("Exam type not found", 404);
        try {
            return await prismaClient_1.prismaMain.examType.update({ where: { id }, data: { ...data, updatedBy: userId } });
        }
        catch (error) {
            if (error?.code === "P2002")
                throw new CustomError_1.CustomError("An exam type with this code or name already exists", 409);
            throw error;
        }
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.examType.findFirst({ where: { id, deletedAt: null }, include: { _count: { select: { exams: true } } } });
        if (!existing)
            throw new CustomError_1.CustomError("Exam type not found", 404);
        if (existing._count.exams > 0)
            throw new CustomError_1.CustomError(`Used by ${existing._count.exams} exams; deactivate instead`, 409);
        await prismaClient_1.prismaMain.examType.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: userId } });
        return null;
    },
};
