"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveTypeService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
exports.LeaveTypeService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {};
        if (query.search) {
            whereClause.OR = [
                { name: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [leaveTypes, total] = await Promise.all([
            prismaClient_1.prismaMain.leaveType.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.leaveType.count({ where: whereClause }),
        ]);
        return {
            data: leaveTypes,
            pagination: { page, limit, total },
        };
    },
    async create(data, userId) {
        try {
            const leaveType = await prismaClient_1.prismaMain.leaveType.create({
                data: {
                    ...data,
                    createdBy: userId,
                },
            });
            return leaveType;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A leave type with this name already exists", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const leaveType = await prismaClient_1.prismaMain.leaveType.findFirst({
            where: { id, deletedAt: null },
        });
        if (!leaveType) {
            throw new CustomError_1.CustomError("Leave type not found", 404);
        }
        return leaveType;
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.leaveType.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Leave type not found", 404);
        }
        try {
            const updated = await prismaClient_1.prismaMain.leaveType.update({
                where: { id },
                data: { ...data, updatedBy: userId },
            });
            return updated;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A leave type with this code already exists", 409);
            }
            throw error;
        }
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.leaveType.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Leave type not found", 404);
        }
        await prismaClient_1.prismaMain.leaveType.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
};
