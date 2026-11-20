"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const safe_select_1 = require("@/utils/safe-select");
const CustomError_1 = require("@/errors/CustomError");
async function assertValidAccount(accountId) {
    const account = await prismaClient_1.prismaMain.account.findFirst({
        where: { id: accountId, deletedAt: null },
        select: { id: true, isActive: true, isGroup: true, type: true },
    });
    if (!account)
        throw new CustomError_1.CustomError("Ledger account not found", 404);
    if (!account.isActive || account.isGroup)
        throw new CustomError_1.CustomError("Payment method account must be an active, non-group account", 400);
    if (account.type !== "ASSET")
        throw new CustomError_1.CustomError("Payment method must map to an ASSET account", 400);
}
exports.PaymentMethodService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 50);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = { deletedAt: null };
        if (query.search) {
            whereClause.OR = [
                { name: { contains: query.search, mode: "insensitive" } },
                { code: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [paymentMethods, total] = await Promise.all([
            prismaClient_1.prismaMain.paymentMethod.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: { account: { select: safe_select_1.ACCOUNT_SAFE_SELECT } },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.paymentMethod.count({ where: whereClause }),
        ]);
        return { data: paymentMethods, pagination: { page, limit, total } };
    },
    async create(data, userId) {
        if (data.accountId)
            await assertValidAccount(data.accountId);
        try {
            return await prismaClient_1.prismaMain.paymentMethod.create({
                data: {
                    name: data.name,
                    code: data.code,
                    accountId: data.accountId ?? null,
                    isActive: data.isActive ?? true,
                    createdBy: userId,
                },
                include: { account: { select: safe_select_1.ACCOUNT_SAFE_SELECT } },
            });
        }
        catch (error) {
            if (error?.code === "P2002")
                throw new CustomError_1.CustomError("A payment method with this code already exists", 409);
            throw error;
        }
    },
    async getById(id) {
        const paymentMethod = await prismaClient_1.prismaMain.paymentMethod.findFirst({
            where: { id, deletedAt: null },
            include: { account: { select: safe_select_1.ACCOUNT_SAFE_SELECT } },
        });
        if (!paymentMethod)
            throw new CustomError_1.CustomError("Payment method not found", 404);
        return paymentMethod;
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.paymentMethod.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Payment method not found", 404);
        if (data.accountId)
            await assertValidAccount(data.accountId);
        try {
            return await prismaClient_1.prismaMain.paymentMethod.update({
                where: { id },
                data: { ...data, updatedBy: userId },
                include: { account: { select: safe_select_1.ACCOUNT_SAFE_SELECT } },
            });
        }
        catch (error) {
            if (error?.code === "P2002")
                throw new CustomError_1.CustomError("A payment method with this code already exists", 409);
            throw error;
        }
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.paymentMethod.findFirst({
            where: { id, deletedAt: null },
            include: { _count: { select: { paymentLines: true } } },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Payment method not found", 404);
        if (existing._count.paymentLines > 0)
            throw new CustomError_1.CustomError("Payment method has receipt lines; deactivate instead", 409);
        await prismaClient_1.prismaMain.paymentMethod.update({
            where: { id },
            data: { deletedAt: new Date(), updatedBy: userId },
        });
        return null;
    },
};
