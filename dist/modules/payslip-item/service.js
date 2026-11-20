"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayslipItemService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
exports.PayslipItemService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {};
        if (query.search) {
            whereClause.OR = [
                { componentId: { contains: query.search, mode: "insensitive" } },
                { description: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [items, total] = await Promise.all([
            prismaClient_1.prismaMain.payslipItem.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    component: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.payslipItem.count({ where: whereClause }),
        ]);
        return {
            data: items,
            pagination: { page, limit, total },
        };
    },
    async create(data, userId) {
        try {
            const item = await prismaClient_1.prismaMain.payslipItem.create({
                data: {
                    ...data,
                    payslipId: data.payslipId,
                    createdBy: userId,
                },
                include: {
                    component: true,
                },
            });
            return item;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A payslip item already exists for this payslip and component", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const item = await prismaClient_1.prismaMain.payslipItem.findFirst({
            where: { id },
            include: {
                component: true,
            },
        });
        if (!item) {
            throw new CustomError_1.CustomError("Payslip item not found", 404);
        }
        return item;
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.payslipItem.findFirst({
            where: { id },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Payslip item not found", 404);
        }
        await prismaClient_1.prismaMain.payslipItem.delete({
            where: { id },
        });
        return null;
    },
};
