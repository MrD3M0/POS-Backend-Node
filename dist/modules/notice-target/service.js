"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoticeTargetService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
exports.NoticeTargetService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {
            deletedAt: null,
        };
        if (query.search) {
            whereClause.OR = [
                { role: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [targets, total] = await Promise.all([
            prismaClient_1.prismaMain.noticeTarget.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    notice: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.noticeTarget.count({ where: whereClause }),
        ]);
        return {
            data: targets,
            pagination: { page, limit, total },
        };
    },
    async create(data, userId) {
        try {
            const target = await prismaClient_1.prismaMain.noticeTarget.create({
                data: {
                    ...data,
                    createdBy: userId,
                },
                include: {
                    notice: true,
                },
            });
            return target;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A notice target already exists for this notice and role", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const target = await prismaClient_1.prismaMain.noticeTarget.findFirst({
            where: { id, deletedAt: null },
            include: {
                notice: true,
            },
        });
        if (!target) {
            throw new CustomError_1.CustomError("Notice target not found", 404);
        }
        return target;
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.noticeTarget.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Notice target not found", 404);
        }
        await prismaClient_1.prismaMain.noticeTarget.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
};
