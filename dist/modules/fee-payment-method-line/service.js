"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeePaymentMethodLineService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
/**
 * Method lines are written only as part of POST /fee-payment (together with
 * the payment total and its journal posting). Direct creates/deletes would
 * break the methodLines == total == allocations invariant.
 */
const DIRECT_WRITE_MESSAGE = "Method lines are managed through POST /fee-payment; cancel the payment instead of editing its lines";
exports.FeePaymentMethodLineService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {};
        if (query.search) {
            whereClause.OR = [
                { feePaymentId: { contains: query.search, mode: "insensitive" } },
                { referenceNo: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [lines, total] = await Promise.all([
            prismaClient_1.prismaMain.feePaymentMethodLine.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    paymentMethod: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.feePaymentMethodLine.count({ where: whereClause }),
        ]);
        return {
            data: lines,
            pagination: { page, limit, total },
        };
    },
    async create(_data, _userId) {
        throw new CustomError_1.CustomError(DIRECT_WRITE_MESSAGE, 409);
    },
    async getById(id) {
        const line = await prismaClient_1.prismaMain.feePaymentMethodLine.findUnique({
            where: { id },
            include: {
                paymentMethod: true,
            },
        });
        if (!line) {
            throw new CustomError_1.CustomError("Fee payment method line not found", 404);
        }
        return line;
    },
    async delete(_id, _userId) {
        throw new CustomError_1.CustomError(DIRECT_WRITE_MESSAGE, 409);
    },
};
