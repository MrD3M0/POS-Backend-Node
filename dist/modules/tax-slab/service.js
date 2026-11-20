"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaxSlabService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
exports.TaxSlabService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {};
        if (query.search) {
            whereClause.OR = [
                { fromAmount: { contains: query.search, mode: "insensitive" } },
                { toAmount: { contains: query.search, mode: "insensitive" } },
                { ratePercent: { contains: query.search, mode: "insensitive" } },
            ];
        }
        if (query.fiscalYearId) {
            whereClause.fiscalYearId = query.fiscalYearId;
        }
        if (query.isCouple !== undefined) {
            whereClause.isCouple = query.isCouple;
        }
        const [taxSlabs, total] = await Promise.all([
            prismaClient_1.prismaMain.taxSlab.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    fiscalYear: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.taxSlab.count({ where: whereClause }),
        ]);
        return {
            taxSlabs,
            pagination: {
                page,
                limit,
                total,
            },
        };
    },
    async create(data, userId) {
        // Validate fiscal year exists
        const fiscalYear = await prismaClient_1.prismaMain.fiscalYear.findFirst({
            where: { id: data.fiscalYearId, deletedAt: null },
        });
        if (!fiscalYear) {
            throw new CustomError_1.CustomError("Fiscal year not found or has been deleted", 404);
        }
        try {
            const taxSlab = await prismaClient_1.prismaMain.taxSlab.create({
                data: {
                    ...data,
                    createdBy: userId,
                },
                include: {
                    fiscalYear: true,
                },
            });
            return taxSlab;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A tax slab already exists for this fiscal year", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const taxSlab = await prismaClient_1.prismaMain.taxSlab.findFirst({
            where: { id, deletedAt: null },
            include: {
                fiscalYear: true,
            },
        });
        if (!taxSlab) {
            throw new CustomError_1.CustomError("Tax slab not found", 404);
        }
        return taxSlab;
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.taxSlab.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Tax slab not found", 404);
        }
        try {
            const updated = await prismaClient_1.prismaMain.taxSlab.update({
                where: { id },
                data: {
                    ...data,
                    updatedBy: userId,
                },
                include: {
                    fiscalYear: true,
                },
            });
            return updated;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A tax slab already exists for this fiscal year", 409);
            }
            throw error;
        }
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.taxSlab.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Tax slab not found", 404);
        }
        await prismaClient_1.prismaMain.taxSlab.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
    async copy(fromFiscalYearId, toFiscalYearId, userId) {
        if (!fromFiscalYearId || !toFiscalYearId)
            throw new CustomError_1.CustomError("fromFiscalYearId and toFiscalYearId are required", 400);
        if (fromFiscalYearId === toFiscalYearId)
            throw new CustomError_1.CustomError("Source and target fiscal year must be different", 400);
        const [fromYear, toYear] = await Promise.all([
            prismaClient_1.prismaMain.fiscalYear.findFirst({ where: { id: fromFiscalYearId, deletedAt: null } }),
            prismaClient_1.prismaMain.fiscalYear.findFirst({ where: { id: toFiscalYearId, deletedAt: null } }),
        ]);
        if (!fromYear)
            throw new CustomError_1.CustomError("Source fiscal year not found", 404);
        if (!toYear)
            throw new CustomError_1.CustomError("Target fiscal year not found", 404);
        const source = await prismaClient_1.prismaMain.taxSlab.findMany({ where: { fiscalYearId: fromFiscalYearId, deletedAt: null } });
        if (source.length === 0)
            throw new CustomError_1.CustomError("Source fiscal year has no tax slabs", 409);
        let created = 0;
        let skipped = 0;
        for (const slab of source) {
            const exists = await prismaClient_1.prismaMain.taxSlab.findFirst({
                where: { fiscalYearId: toFiscalYearId, isCouple: slab.isCouple, fromAmount: slab.fromAmount, deletedAt: null },
            });
            if (exists) {
                skipped += 1;
                continue;
            }
            await prismaClient_1.prismaMain.taxSlab.create({
                data: {
                    fiscalYearId: toFiscalYearId,
                    isCouple: slab.isCouple,
                    fromAmount: slab.fromAmount,
                    toAmount: slab.toAmount,
                    ratePercent: slab.ratePercent,
                    createdBy: userId,
                },
            });
            created += 1;
        }
        return { fromFiscalYearId, toFiscalYearId, created, skipped };
    },
};
