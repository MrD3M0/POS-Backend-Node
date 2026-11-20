"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
exports.AuditLogService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 20, 200);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const where = {};
        if (query.entity)
            where.entity = query.entity;
        if (query.entityId)
            where.entityId = query.entityId;
        if (query.action)
            where.action = query.action;
        if (query.userId)
            where.userId = query.userId;
        if (query.from || query.to) {
            where.createdAt = {
                ...(query.from ? { gte: new Date(query.from) } : {}),
                ...(query.to ? { lte: new Date(query.to) } : {}),
            };
        }
        if (query.search) {
            where.OR = [
                { entity: { contains: query.search, mode: "insensitive" } },
                { action: { contains: query.search, mode: "insensitive" } },
                { entityId: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [logs, total] = await Promise.all([
            prismaClient_1.prismaMain.auditLog.findMany({
                where,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.auditLog.count({ where }),
        ]);
        const userIds = [...new Set(logs.map((log) => log.userId).filter(Boolean))];
        const users = userIds.length
            ? await prismaClient_1.prismaMain.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, email: true, username: true, role: true },
            })
            : [];
        const userMap = new Map(users.map((user) => [user.id, user]));
        return {
            data: logs.map((log) => ({
                ...log,
                user: log.userId ? userMap.get(log.userId) ?? null : null,
            })),
            pagination: { page, limit, total },
        };
    },
    async getById(id) {
        const log = await prismaClient_1.prismaMain.auditLog.findUnique({ where: { id } });
        if (!log)
            throw new CustomError_1.CustomError("Audit entry not found", 404);
        return log;
    },
    async filterOptions() {
        const [entities, actions] = await Promise.all([
            prismaClient_1.prismaMain.auditLog.findMany({ distinct: ["entity"], select: { entity: true }, orderBy: { entity: "asc" } }),
            prismaClient_1.prismaMain.auditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
        ]);
        return {
            entities: entities.map((row) => row.entity),
            actions: actions.map((row) => row.action),
        };
    },
};
