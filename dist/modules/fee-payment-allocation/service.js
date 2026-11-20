"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeePaymentAllocationService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
/**
 * Allocations are written only as part of POST /fee-payment (they must sum
 * to the total and fit each item's remaining due). Direct creates/deletes
 * would break that invariant, so they are blocked.
 */
const DIRECT_WRITE_MESSAGE = "Allocations are managed through POST /fee-payment; cancel the payment instead of editing its allocations";
exports.FeePaymentAllocationService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {};
        if (query.search) {
            whereClause.OR = [
                { feePaymentId: { contains: query.search, mode: "insensitive" } },
                { studentFeeItemId: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [allocations, total] = await Promise.all([
            prismaClient_1.prismaMain.feePaymentAllocation.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    studentFeeItem: true,
                    feeInstallment: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.feePaymentAllocation.count({ where: whereClause }),
        ]);
        return {
            data: allocations,
            pagination: { page, limit, total },
        };
    },
    async create(_data, _userId) {
        throw new CustomError_1.CustomError(DIRECT_WRITE_MESSAGE, 409);
    },
    async getById(id) {
        const allocation = await prismaClient_1.prismaMain.feePaymentAllocation.findUnique({
            where: { id },
            include: {
                studentFeeItem: true,
                feeInstallment: true,
            },
        });
        if (!allocation) {
            throw new CustomError_1.CustomError("Fee payment allocation not found", 404);
        }
        return allocation;
    },
    async delete(_id, _userId) {
        throw new CustomError_1.CustomError(DIRECT_WRITE_MESSAGE, 409);
    },
};
