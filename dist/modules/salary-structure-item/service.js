"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalaryStructureItemService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
exports.SalaryStructureItemService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {};
        if (query.salaryStructureId)
            whereClause.salaryStructureId = query.salaryStructureId;
        if (query.componentId)
            whereClause.componentId = query.componentId;
        if (query.search) {
            whereClause.OR = [
                { component: { name: { contains: query.search, mode: "insensitive" } } },
                { component: { code: { contains: query.search, mode: "insensitive" } } },
            ];
        }
        const [items, total] = await Promise.all([
            prismaClient_1.prismaMain.salaryStructureItem.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    component: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.salaryStructureItem.count({ where: whereClause }),
        ]);
        return {
            items,
            pagination: {
                page,
                limit,
                total,
            },
        };
    },
    async create(data, userId) {
        // Validate component exists and is not soft-deleted
        const component = await prismaClient_1.prismaMain.salaryComponent.findFirst({
            where: { id: data.componentId, deletedAt: null },
        });
        if (!component) {
            throw new CustomError_1.CustomError("Salary component not found or has been deleted", 404);
        }
        // Validate parent structure exists and is not soft-deleted
        // (previously this wrongly looked up `data.componentId` as the structure id)
        const structure = await prismaClient_1.prismaMain.salaryStructure.findFirst({
            where: { id: data.salaryStructureId, deletedAt: null },
        });
        if (!structure) {
            throw new CustomError_1.CustomError("Salary structure not found or has been deleted", 404);
        }
        try {
            const item = await prismaClient_1.prismaMain.salaryStructureItem.create({
                data: {
                    ...data,
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
                throw new CustomError_1.CustomError("A salary structure item already exists for this component in this structure", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const item = await prismaClient_1.prismaMain.salaryStructureItem.findFirst({
            where: { id, deletedAt: null },
            include: {
                component: true,
            },
        });
        if (!item) {
            throw new CustomError_1.CustomError("Salary structure item not found", 404);
        }
        return item;
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.salaryStructureItem.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Salary structure item not found", 404);
        }
        try {
            const updated = await prismaClient_1.prismaMain.salaryStructureItem.update({
                where: { id },
                data: {
                    ...data,
                    updatedBy: userId,
                },
                include: {
                    component: true,
                },
            });
            return updated;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A salary structure item already exists for this component in this structure", 409);
            }
            throw error;
        }
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.salaryStructureItem.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Salary structure item not found", 404);
        }
        await prismaClient_1.prismaMain.salaryStructureItem.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
};
