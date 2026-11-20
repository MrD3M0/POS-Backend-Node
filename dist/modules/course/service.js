"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
exports.CourseService = {
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
        const [courses, total] = await Promise.all([
            prismaClient_1.prismaMain.course.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.course.count({ where: whereClause }),
        ]);
        return {
            courses,
            pagination: {
                page,
                limit,
                total,
            },
        };
    },
    async create(data, userId) {
        const existing = await prismaClient_1.prismaMain.course.findFirst({
            where: { code: data.code, deletedAt: null },
        });
        if (existing) {
            throw new CustomError_1.CustomError("A course with this code already exists", 409);
        }
        try {
            const course = await prismaClient_1.prismaMain.course.create({
                data: {
                    ...data,
                    ...(userId && { createdBy: userId }),
                },
            });
            return course;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A course with this code already exists", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const course = await prismaClient_1.prismaMain.course.findFirst({
            where: { id, deletedAt: null },
            include: { batches: true, feeStructures: true },
        });
        if (!course) {
            throw new CustomError_1.CustomError("Course not found", 404);
        }
        return course;
    },
    async update(id, data, userId) {
        const course = await prismaClient_1.prismaMain.course.findFirst({
            where: { id, deletedAt: null },
        });
        if (!course) {
            throw new CustomError_1.CustomError("Course not found", 404);
        }
        if (data.code) {
            const duplicate = await prismaClient_1.prismaMain.course.findFirst({
                where: {
                    code: data.code,
                    NOT: { id },
                    deletedAt: null,
                },
            });
            if (duplicate) {
                throw new CustomError_1.CustomError("A course with this code already exists", 409);
            }
        }
        // Effective system/totalTerms must satisfy SEMESTER=8 / YEARLY=4, and
        // must not shrink below terms already used by existing batches.
        const effectiveSystem = data.system ?? course.system;
        const effectiveTotalTerms = data.totalTerms ?? course.totalTerms;
        if (effectiveSystem === "SEMESTER" && effectiveTotalTerms !== 8) {
            throw new CustomError_1.CustomError("SEMESTER courses must have totalTerms = 8", 400);
        }
        if (effectiveSystem === "YEARLY" && effectiveTotalTerms !== 4) {
            throw new CustomError_1.CustomError("YEARLY courses must have totalTerms = 4", 400);
        }
        if (effectiveTotalTerms < course.totalTerms) {
            const maxTerm = await prismaClient_1.prismaMain.batchTerm.aggregate({
                where: { batch: { courseId: id }, deletedAt: null },
                _max: { termNumber: true },
            });
            const maxCurrent = await prismaClient_1.prismaMain.batch.aggregate({
                where: { courseId: id, deletedAt: null },
                _max: { currentTermNumber: true },
            });
            const used = Math.max(maxTerm._max.termNumber ?? 0, maxCurrent._max.currentTermNumber ?? 0);
            if (effectiveTotalTerms < used) {
                throw new CustomError_1.CustomError(`totalTerms (${effectiveTotalTerms}) cannot be less than the highest term already in use (${used})`, 409);
            }
        }
        try {
            const updated = await prismaClient_1.prismaMain.course.update({
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
                throw new CustomError_1.CustomError("A course with this code already exists", 409);
            }
            throw error;
        }
    },
    async delete(id, userId) {
        const course = await prismaClient_1.prismaMain.course.findFirst({
            where: { id, deletedAt: null },
        });
        if (!course) {
            throw new CustomError_1.CustomError("Course not found", 404);
        }
        await prismaClient_1.prismaMain.course.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
};
