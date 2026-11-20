"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeHeadService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
exports.FeeHeadService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 50);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = { deletedAt: null };
        if (query.search) {
            whereClause.OR = [
                { code: { contains: query.search, mode: "insensitive" } },
                { name: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [items, total] = await Promise.all([
            prismaClient_1.prismaMain.feeHead.findMany({ where: whereClause, skip, take: (0, queryFilters_1.toPrismaTake)(limit), orderBy: { createdAt: "desc" }, include: { _count: { select: { structureItems: true, studentItems: true } } } }),
            prismaClient_1.prismaMain.feeHead.count({ where: whereClause }),
        ]);
        return { data: items, pagination: { page, limit, total } };
    },
    async create(data, userId) {
        try {
            return await prismaClient_1.prismaMain.feeHead.create({ data: { ...data, createdBy: userId } });
        }
        catch (error) {
            if (error?.code === "P2002")
                throw new CustomError_1.CustomError("A fee head with this code already exists", 409);
            throw error;
        }
    },
    async getById(id) {
        const head = await prismaClient_1.prismaMain.feeHead.findFirst({ where: { id, deletedAt: null } });
        if (!head)
            throw new CustomError_1.CustomError("Fee head not found", 404);
        return head;
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.feeHead.findFirst({ where: { id, deletedAt: null } });
        if (!existing)
            throw new CustomError_1.CustomError("Fee head not found", 404);
        if (data.isActive === false) {
            const inUse = await prismaClient_1.prismaMain.feeStructureItem.count({ where: { feeHeadId: id } });
            if (inUse > 0)
                throw new CustomError_1.CustomError(`Used in ${inUse} fee structure items; review before deactivating`, 409);
        }
        try {
            return await prismaClient_1.prismaMain.feeHead.update({ where: { id }, data: { ...data, updatedBy: userId } });
        }
        catch (error) {
            if (error?.code === "P2002")
                throw new CustomError_1.CustomError("A fee head with this code already exists", 409);
            throw error;
        }
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.feeHead.findFirst({ where: { id, deletedAt: null }, include: { _count: { select: { structureItems: true, studentItems: true } } } });
        if (!existing)
            throw new CustomError_1.CustomError("Fee head not found", 404);
        if (existing._count.structureItems > 0 || existing._count.studentItems > 0) {
            throw new CustomError_1.CustomError("Fee head is in use; deactivate instead", 409);
        }
        await prismaClient_1.prismaMain.feeHead.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: userId } });
        return null;
    },
};
