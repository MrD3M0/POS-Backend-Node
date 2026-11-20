"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeStructureItemService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
const money_1 = require("@/lib/money");
exports.FeeStructureItemService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {
            deletedAt: null,
        };
        if (query.search) {
            whereClause.OR = [
                { feeHeadId: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [items, total] = await Promise.all([
            prismaClient_1.prismaMain.feeStructureItem.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    feeHead: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.feeStructureItem.count({ where: whereClause }),
        ]);
        return {
            data: items,
            pagination: { page, limit, total },
        };
    },
    async create(data, userId) {
        const structure = await prismaClient_1.prismaMain.feeStructure.findFirst({
            where: { id: data.feeStructureId, deletedAt: null },
        });
        if (!structure) {
            throw new CustomError_1.CustomError("Fee structure not found", 404);
        }
        const feeHead = await prismaClient_1.prismaMain.feeHead.findFirst({
            where: { id: data.feeHeadId, deletedAt: null },
        });
        if (!feeHead) {
            throw new CustomError_1.CustomError("Fee head not found", 404);
        }
        if (!feeHead.isActive) {
            throw new CustomError_1.CustomError("Fee head is inactive", 400);
        }
        const termNumber = data.termNumber ?? null;
        // One (head, term) row per structure — checked here because Postgres
        // treats NULLs as distinct and the schema's unique cannot cover
        // one-time (NULL term) rows; see docs/constraints.sql.
        const duplicate = await prismaClient_1.prismaMain.feeStructureItem.findFirst({
            where: {
                feeStructureId: data.feeStructureId,
                feeHeadId: data.feeHeadId,
                termNumber,
                deletedAt: null,
            },
        });
        if (duplicate) {
            throw new CustomError_1.CustomError("A fee structure item for this head and term already exists", 409);
        }
        try {
            const item = await prismaClient_1.prismaMain.feeStructureItem.create({
                data: {
                    feeStructureId: data.feeStructureId,
                    feeHeadId: data.feeHeadId,
                    termNumber,
                    amount: (0, money_1.dec)(data.amount, "amount"),
                    ...(userId && { createdBy: userId }),
                },
                include: {
                    feeHead: true,
                },
            });
            return item;
        }
        catch (error) {
            if (error?.code === "P2002") {
                throw new CustomError_1.CustomError("A fee structure item for this head and term already exists", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const item = await prismaClient_1.prismaMain.feeStructureItem.findFirst({
            where: { id, deletedAt: null },
            include: {
                feeHead: true,
            },
        });
        if (!item) {
            throw new CustomError_1.CustomError("Fee structure item not found", 404);
        }
        return item;
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.feeStructureItem.findFirst({
            where: { id, deletedAt: null },
            include: {
                _count: { select: { studentItems: true } },
            },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Fee structure item not found", 404);
        }
        if (existing._count.studentItems > 0) {
            throw new CustomError_1.CustomError("Fee structure item is copied to student fees and cannot be deleted", 409);
        }
        await prismaClient_1.prismaMain.feeStructureItem.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
};
