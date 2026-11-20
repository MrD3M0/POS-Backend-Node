"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeInstallmentService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
const money_1 = require("@/lib/money");
async function loadItemOr404(studentFeeItemId) {
    const item = await prismaClient_1.prismaMain.studentFeeItem.findFirst({
        where: { id: studentFeeItemId, deletedAt: null },
    });
    if (!item) {
        throw new CustomError_1.CustomError("Student fee item not found", 404);
    }
    return item;
}
exports.FeeInstallmentService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {
            deletedAt: null,
        };
        if (query.studentFeeItemId) {
            whereClause.studentFeeItemId = query.studentFeeItemId;
        }
        if (query.search) {
            whereClause.OR = [
                { studentFeeItemId: { contains: query.search, mode: "insensitive" } },
                { dueDateBs: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [installments, total] = await Promise.all([
            prismaClient_1.prismaMain.feeInstallment.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    studentFeeItem: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.feeInstallment.count({ where: whereClause }),
        ]);
        return {
            data: installments,
            pagination: { page, limit, total },
        };
    },
    /**
     * Adds one installment. The running total of installments for the item
     * must never exceed the item's netAmount.
     */
    async create(data, userId) {
        const item = await loadItemOr404(data.studentFeeItemId);
        if (item.isSkipped) {
            throw new CustomError_1.CustomError("Cannot schedule installments for a skipped fee", 400);
        }
        const amount = (0, money_1.dec)(data.amount, "amount");
        const existing = await prismaClient_1.prismaMain.feeInstallment.findMany({
            where: { studentFeeItemId: data.studentFeeItemId, deletedAt: null },
        });
        if (existing.some((row) => row.installmentNo === data.installmentNo)) {
            throw new CustomError_1.CustomError("An installment with this number already exists for this fee item", 409);
        }
        const scheduledTotal = (0, money_1.sumMoney)(existing.map((row) => row.amount));
        if ((0, money_1.round2)(scheduledTotal.plus(amount)).gt((0, money_1.round2)(item.netAmount))) {
            throw new CustomError_1.CustomError(`Installments total would exceed the fee net amount (${(0, money_1.moneyStr)(item.netAmount)})`, 400);
        }
        try {
            const installment = await prismaClient_1.prismaMain.feeInstallment.create({
                data: {
                    studentFeeItemId: data.studentFeeItemId,
                    installmentNo: data.installmentNo,
                    dueDateBs: data.dueDateBs,
                    amount,
                    ...(userId && { createdBy: userId }),
                },
                include: {
                    studentFeeItem: true,
                },
            });
            return installment;
        }
        catch (error) {
            if (error?.code === "P2002") {
                throw new CustomError_1.CustomError("An installment already exists for this student fee item", 409);
            }
            throw error;
        }
    },
    /**
     * Schedules a full installment set in one call (atomic). The installments
     * must sum exactly to the item's netAmount.
     */
    async bulk(data, userId) {
        const item = await loadItemOr404(data.studentFeeItemId);
        if (item.isSkipped) {
            throw new CustomError_1.CustomError("Cannot schedule installments for a skipped fee", 400);
        }
        const existing = await prismaClient_1.prismaMain.feeInstallment.findMany({
            where: { studentFeeItemId: data.studentFeeItemId, deletedAt: null },
        });
        if (existing.length > 0) {
            throw new CustomError_1.CustomError("Installments already exist for this fee item; add them one by one instead", 409);
        }
        const numbers = data.installments.map((row) => row.installmentNo);
        if (new Set(numbers).size !== numbers.length) {
            throw new CustomError_1.CustomError("Installment numbers must be unique within the schedule", 400);
        }
        const total = (0, money_1.sumMoney)(data.installments.map((row) => (0, money_1.dec)(row.amount, "installment amount")));
        if (!(0, money_1.moneyEq)(total, item.netAmount)) {
            throw new CustomError_1.CustomError(`Installments sum (${(0, money_1.moneyStr)(total)}) must equal the fee net amount (${(0, money_1.moneyStr)(item.netAmount)})`, 400);
        }
        try {
            const created = await prismaClient_1.prismaMain.$transaction(async (tx) => tx.feeInstallment.createMany({
                data: data.installments.map((row) => ({
                    studentFeeItemId: data.studentFeeItemId,
                    installmentNo: row.installmentNo,
                    dueDateBs: row.dueDateBs,
                    amount: (0, money_1.dec)(row.amount, "installment amount"),
                    createdBy: userId,
                })),
            }));
            return created;
        }
        catch (error) {
            if (error?.code === "P2002") {
                throw new CustomError_1.CustomError("An installment already exists for this student fee item", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const installment = await prismaClient_1.prismaMain.feeInstallment.findFirst({
            where: { id, deletedAt: null },
            include: {
                studentFeeItem: true,
            },
        });
        if (!installment) {
            throw new CustomError_1.CustomError("Fee installment not found", 404);
        }
        return installment;
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.feeInstallment.findFirst({
            where: { id, deletedAt: null },
            include: {
                _count: { select: { allocations: true } },
            },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Fee installment not found", 404);
        }
        if (existing._count.allocations > 0) {
            throw new CustomError_1.CustomError("Installment has payments allocated and cannot be deleted", 409);
        }
        await prismaClient_1.prismaMain.feeInstallment.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
};
