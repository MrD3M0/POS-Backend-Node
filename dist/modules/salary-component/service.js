"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalaryComponentService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
exports.SalaryComponentService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {
            deletedAt: null,
        };
        if (query.search) {
            whereClause.OR = [
                { code: { contains: query.search, mode: "insensitive" } },
                { name: { contains: query.search, mode: "insensitive" } },
            ];
        }
        if (query.isActive !== undefined) {
            whereClause.isActive = query.isActive;
        }
        const [components, total] = await Promise.all([
            prismaClient_1.prismaMain.salaryComponent.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    structureItems: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.salaryComponent.count({ where: whereClause }),
        ]);
        return {
            components,
            pagination: {
                page,
                limit,
                total,
            },
        };
    },
    async create(data, userId) {
        // Check duplicate code
        const existing = await prismaClient_1.prismaMain.salaryComponent.findFirst({
            where: { code: data.code, deletedAt: null },
        });
        if (existing) {
            throw new CustomError_1.CustomError("A salary component with this code already exists", 409);
        }
        try {
            const component = await prismaClient_1.prismaMain.salaryComponent.create({
                data: {
                    ...data,
                    createdBy: userId,
                },
                include: {
                    structureItems: true,
                },
            });
            return component;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A salary component with this code already exists", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const component = await prismaClient_1.prismaMain.salaryComponent.findFirst({
            where: { id, deletedAt: null },
            include: {
                structureItems: true,
            },
        });
        if (!component) {
            throw new CustomError_1.CustomError("Salary component not found", 404);
        }
        return component;
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.salaryComponent.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Salary component not found", 404);
        }
        try {
            const updated = await prismaClient_1.prismaMain.salaryComponent.update({
                where: { id },
                data: {
                    ...data,
                    updatedBy: userId,
                },
                include: {
                    structureItems: true,
                },
            });
            return updated;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A salary component with this code already exists", 409);
            }
            throw error;
        }
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.salaryComponent.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Salary component not found", 404);
        }
        await prismaClient_1.prismaMain.salaryComponent.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
};
