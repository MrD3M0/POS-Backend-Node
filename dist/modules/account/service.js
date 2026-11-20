"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
const audit_1 = require("@/lib/audit");
const service_1 = require("@/modules/admin-dashboard/service");
const money_1 = require("@/lib/money");
async function assertNoCycle(id, parentId) {
    if (!parentId)
        return;
    let cursor = parentId;
    while (cursor) {
        if (cursor === id)
            throw new CustomError_1.CustomError("Account parent would create a cycle", 409);
        const parent = await prismaClient_1.prismaMain.account.findUnique({
            where: { id: cursor },
            select: { parentId: true },
        });
        cursor = parent?.parentId ?? null;
    }
}
async function computedBalances() {
    const rows = await prismaClient_1.prismaMain.journalLine.groupBy({
        by: ["accountId"],
        _sum: { debit: true, credit: true },
    });
    return new Map(rows.map((row) => [
        row.accountId,
        {
            debit: (0, money_1.moneyStr)(row._sum.debit ?? (0, money_1.dec)(0)),
            credit: (0, money_1.moneyStr)(row._sum.credit ?? (0, money_1.dec)(0)),
        },
    ]));
}
exports.AccountService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 50, 500);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = query.includeDeleted
            ? {}
            : { deletedAt: null };
        if (query.type)
            whereClause.type = query.type;
        if (query.search) {
            whereClause.OR = [
                { code: { contains: query.search, mode: "insensitive" } },
                { name: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [accounts, total] = await Promise.all([
            prismaClient_1.prismaMain.account.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                orderBy: [{ code: "asc" }],
                include: {
                    parent: { select: { id: true, code: true, name: true } },
                    _count: { select: { children: true, journalLines: true } },
                },
            }),
            prismaClient_1.prismaMain.account.count({ where: whereClause }),
        ]);
        return { data: accounts, pagination: { page, limit, total } };
    },
    async tree() {
        const balances = await computedBalances();
        const [accounts] = await Promise.all([
            prismaClient_1.prismaMain.account.findMany({
                where: { deletedAt: null },
                orderBy: [{ code: "asc" }],
                select: {
                    id: true,
                    code: true,
                    name: true,
                    type: true,
                    parentId: true,
                    isGroup: true,
                    isSystem: true,
                    isActive: true,
                },
            }),
        ]);
        const byId = new Map();
        for (const account of accounts) {
            byId.set(account.id, {
                ...account,
                balance: balances.get(account.id) ?? { debit: "0", credit: "0" },
                children: [],
            });
        }
        const roots = [];
        for (const node of byId.values()) {
            const parentId = node.parentId;
            if (parentId && byId.has(parentId)) {
                byId.get(parentId).children.push(node);
            }
            else {
                roots.push(node);
            }
        }
        return roots;
    },
    async create(data, userId) {
        if (data.parentId) {
            const parent = await prismaClient_1.prismaMain.account.findFirst({
                where: { id: data.parentId, deletedAt: null },
            });
            if (!parent)
                throw new CustomError_1.CustomError("Parent account not found", 404);
            if (parent.type !== data.type)
                throw new CustomError_1.CustomError(`Child account type must match parent type (${parent.type})`, 409);
        }
        try {
            return await prismaClient_1.prismaMain.$transaction(async (tx) => {
                const account = await tx.account.create({
                    data: {
                        code: data.code,
                        name: data.name,
                        type: data.type,
                        parentId: data.parentId ?? null,
                        isGroup: data.isGroup ?? false,
                        isActive: data.isActive ?? true,
                        isSystem: false,
                        createdBy: userId,
                    },
                });
                await (0, audit_1.writeAudit)(tx, {
                    entity: "Account",
                    entityId: account.id,
                    action: "CREATE",
                    newValues: account,
                    userId,
                });
                return account;
            });
        }
        catch (error) {
            if (error?.code === "P2002")
                throw new CustomError_1.CustomError("An account with this code already exists", 409);
            throw error;
        }
    },
    async getById(id) {
        const account = await prismaClient_1.prismaMain.account.findFirst({
            where: { id, deletedAt: null },
            include: {
                parent: true,
                children: { where: { deletedAt: null } },
                _count: { select: { journalLines: true } },
            },
        });
        if (!account)
            throw new CustomError_1.CustomError("Account not found", 404);
        return account;
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.account.findFirst({
            where: { id, deletedAt: null },
            include: { _count: { select: { journalLines: true, children: true } } },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Account not found", 404);
        if (existing.isSystem && data.isActive === false) {
            throw new CustomError_1.CustomError(`System account ${existing.code} cannot be deactivated`, 409);
        }
        if (data.isActive === false && existing._count.journalLines > 0) {
            throw new CustomError_1.CustomError("Account has postings; deactivate is blocked for posted accounts in this implementation", 409);
        }
        if (data.isActive === false && existing._count.children > 0) {
            throw new CustomError_1.CustomError("Account has child accounts; deactivate or move children first", 409);
        }
        if (data.parentId !== undefined && data.parentId !== existing.parentId) {
            await assertNoCycle(id, data.parentId);
            if (data.parentId) {
                const parent = await prismaClient_1.prismaMain.account.findFirst({
                    where: { id: data.parentId, deletedAt: null },
                });
                if (!parent)
                    throw new CustomError_1.CustomError("Parent account not found", 404);
                if (parent.type !== existing.type)
                    throw new CustomError_1.CustomError(`Parent must be of type ${existing.type}`, 409);
            }
        }
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            const account = await tx.account.update({
                where: { id },
                data: {
                    ...(data.name !== undefined ? { name: data.name } : {}),
                    ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
                    ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
                    updatedBy: userId,
                },
            });
            await (0, audit_1.writeAudit)(tx, {
                entity: "Account",
                entityId: id,
                action: "UPDATE",
                oldValues: existing,
                newValues: account,
                userId,
            });
            return account;
        });
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.account.findFirst({
            where: { id, deletedAt: null },
            include: {
                _count: {
                    select: { children: true, journalLines: true, paymentMethods: true },
                },
            },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Account not found", 404);
        if (existing.isSystem)
            throw new CustomError_1.CustomError(`System account ${existing.code} cannot be deleted`, 409);
        if (existing._count.journalLines > 0)
            throw new CustomError_1.CustomError("Account has journal postings and cannot be deleted", 409);
        if (existing._count.children > 0)
            throw new CustomError_1.CustomError("Account has child accounts and cannot be deleted", 409);
        if (existing._count.paymentMethods > 0)
            throw new CustomError_1.CustomError("Account is mapped to a payment method and cannot be deleted", 409);
        await prismaClient_1.prismaMain.$transaction(async (tx) => {
            await tx.account.update({
                where: { id },
                data: { deletedAt: new Date(), isActive: false, updatedBy: userId },
            });
            await (0, audit_1.writeAudit)(tx, {
                entity: "Account",
                entityId: id,
                action: "DELETE",
                oldValues: existing,
                userId,
            });
        });
        return null;
    },
    async seedDefault(userId) {
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            let created = 0;
            let skipped = 0;
            for (const account of service_1.REQUIRED_SYSTEM_ACCOUNTS) {
                const exists = await tx.account.findFirst({
                    where: { code: account.code },
                });
                if (exists) {
                    if (!exists.isSystem) {
                        await tx.account.update({
                            where: { id: exists.id },
                            data: { isSystem: true, isActive: true, deletedAt: null },
                        });
                    }
                    skipped += 1;
                    continue;
                }
                await tx.account.create({
                    data: {
                        code: account.code,
                        name: account.name,
                        type: account.type,
                        isGroup: false,
                        isSystem: true,
                        isActive: true,
                        createdBy: userId,
                    },
                });
                created += 1;
            }
            await (0, audit_1.writeAudit)(tx, {
                entity: "Account",
                action: "SEED_DEFAULT",
                newValues: { created, skipped },
                userId,
            });
            return { created, skipped, total: service_1.REQUIRED_SYSTEM_ACCOUNTS.length };
        });
    },
};
function inferType(code) {
    if (code.startsWith("1"))
        return "ASSET";
    if (code.startsWith("2"))
        return "LIABILITY";
    if (code.startsWith("3"))
        return "EQUITY";
    if (code.startsWith("4") || code.includes("INCOME"))
        return "INCOME";
    return "EXPENSE";
}
