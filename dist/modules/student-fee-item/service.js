"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentFeeItemService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
const money_1 = require("@/lib/money");
/**
 * Totalling rule shared by create/update:
 *  - netAmount = amount - discountAmount (Decimal math)
 *  - a discount is only valid with a reason; a skip requires a reason
 */
function computeItemFields(input, existing) {
    const amount = (0, money_1.dec)(input.amount ?? existing?.amount ?? "0", "amount");
    const discountAmount = (0, money_1.dec)(input.discountAmount ?? existing?.discountAmount ?? "0", "discountAmount");
    const discountReason = input.discountReason ?? existing?.discountReason ?? undefined;
    const isSkipped = input.isSkipped ?? existing?.isSkipped ?? false;
    const skipReason = input.skipReason ?? existing?.skipReason ?? undefined;
    if (amount.isNegative()) {
        throw new CustomError_1.CustomError("Amount cannot be negative", 400);
    }
    if (discountAmount.isNegative()) {
        throw new CustomError_1.CustomError("Discount amount cannot be negative", 400);
    }
    if (discountAmount.gt(amount)) {
        throw new CustomError_1.CustomError("Discount cannot exceed the fee amount", 400);
    }
    if (discountAmount.isPositive() && !discountReason?.trim()) {
        throw new CustomError_1.CustomError("A discount requires a discount reason", 400);
    }
    if (isSkipped && !skipReason?.trim()) {
        throw new CustomError_1.CustomError("Skipping a fee requires a skip reason", 400);
    }
    return {
        amount: (0, money_1.round2)(amount).toFixed(2),
        discountAmount: (0, money_1.round2)(discountAmount).toFixed(2),
        discountReason: discountReason?.trim() || undefined,
        netAmount: (0, money_1.round2)(amount.minus(discountAmount)).toFixed(2),
        isSkipped,
        skipReason: skipReason?.trim() || undefined,
    };
}
exports.StudentFeeItemService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {
            deletedAt: null,
        };
        if (query.studentFeeId) {
            whereClause.studentFeeId = query.studentFeeId;
        }
        if (query.search) {
            whereClause.OR = [
                { feeHeadId: { contains: query.search, mode: "insensitive" } },
                { description: { contains: query.search, mode: "insensitive" } },
                { dueDateBs: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [items, total] = await Promise.all([
            prismaClient_1.prismaMain.studentFeeItem.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: { feeHead: true, installments: true },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.studentFeeItem.count({ where: whereClause }),
        ]);
        return {
            data: items,
            pagination: { page, limit, total },
        };
    },
    async create(data, userId) {
        const [parentFee, feeHead] = await Promise.all([
            prismaClient_1.prismaMain.studentFee.findFirst({
                where: { id: data.studentFeeId, deletedAt: null },
            }),
            prismaClient_1.prismaMain.feeHead.findFirst({
                where: { id: data.feeHeadId, deletedAt: null },
            }),
        ]);
        if (!parentFee) {
            throw new CustomError_1.CustomError("Student fee not found", 404);
        }
        if (!feeHead) {
            throw new CustomError_1.CustomError("Fee head not found", 404);
        }
        const feeStructureItemId = data.feeStructureItemId ?? null;
        if (feeStructureItemId) {
            const structureItem = await prismaClient_1.prismaMain.feeStructureItem.findFirst({
                where: { id: feeStructureItemId, deletedAt: null },
            });
            if (!structureItem) {
                throw new CustomError_1.CustomError("Fee structure item not found", 404);
            }
            const duplicate = await prismaClient_1.prismaMain.studentFeeItem.findFirst({
                where: {
                    studentFeeId: data.studentFeeId,
                    feeStructureItemId,
                    deletedAt: null,
                },
            });
            if (duplicate) {
                throw new CustomError_1.CustomError("This structure item is already copied to the student's fee", 409);
            }
        }
        const fields = computeItemFields(data);
        try {
            const item = await prismaClient_1.prismaMain.studentFeeItem.create({
                data: {
                    studentFeeId: data.studentFeeId,
                    feeHeadId: data.feeHeadId,
                    feeStructureItemId,
                    termNumber: data.termNumber ?? null,
                    description: data.description ?? null,
                    dueDateBs: data.dueDateBs ?? null,
                    ...fields,
                    ...(userId && { createdBy: userId }),
                },
                include: { feeHead: true },
            });
            return item;
        }
        catch (error) {
            if (error?.code === "P2002") {
                throw new CustomError_1.CustomError("A student fee item already exists for this fee and term", 409);
            }
            throw error;
        }
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.studentFeeItem.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Student fee item not found", 404);
        }
        const hasPayments = await prismaClient_1.prismaMain.feePaymentAllocation.count({
            where: { studentFeeItemId: id },
        });
        if (hasPayments > 0 && (data.amount !== undefined || data.discountAmount !== undefined)) {
            throw new CustomError_1.CustomError("Cannot change amount/discount after payments were allocated; cancel those payments first", 409);
        }
        const fields = computeItemFields(data, {
            amount: existing.amount,
            discountAmount: existing.discountAmount,
            discountReason: existing.discountReason,
            isSkipped: existing.isSkipped,
            skipReason: existing.skipReason,
        });
        const item = await prismaClient_1.prismaMain.studentFeeItem.update({
            where: { id },
            data: {
                description: data.description ?? existing.description,
                dueDateBs: data.dueDateBs ?? existing.dueDateBs,
                ...fields,
                updatedBy: userId,
            },
            include: { feeHead: true },
        });
        return item;
    },
    async getById(id) {
        const item = await prismaClient_1.prismaMain.studentFeeItem.findFirst({
            where: { id, deletedAt: null },
            include: { feeHead: true, installments: { where: { deletedAt: null } } },
        });
        if (!item) {
            throw new CustomError_1.CustomError("Student fee item not found", 404);
        }
        return item;
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.studentFeeItem.findFirst({
            where: { id, deletedAt: null },
            include: {
                _count: { select: { allocations: true } },
            },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Student fee item not found", 404);
        }
        if (existing._count.allocations > 0) {
            throw new CustomError_1.CustomError("Student fee item has payments allocated and cannot be deleted; cancel those payments or adjust the item instead", 409);
        }
        await prismaClient_1.prismaMain.studentFeeItem.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
};
