import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";

export const AuditLogService = {
  async index(query: {
    page?: number;
    limit?: number;
    search?: string;
    entity?: string;
    action?: string;
    userId?: string;
    from?: string;
    to?: string;
    entityId?: string;
  }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 20, 200);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.entity) where.entity = query.entity;
    if (query.entityId) where.entityId = query.entityId;
    if (query.action) where.action = query.action;
    if (query.userId) where.userId = query.userId;
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
      prismaMain.auditLog.findMany({
        where,
        skip,
        take: toPrismaTake(limit),
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.auditLog.count({ where }),
    ]);

    const userIds = [...new Set(logs.map((log) => log.userId).filter(Boolean))] as string[];
    const users = userIds.length
      ? await prismaMain.user.findMany({
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

  async getById(id: string) {
    const log = await prismaMain.auditLog.findUnique({ where: { id } });
    if (!log) throw new CustomError("Audit entry not found", 404);
    return log;
  },

  async filterOptions() {
    const [entities, actions] = await Promise.all([
      prismaMain.auditLog.findMany({ distinct: ["entity"], select: { entity: true }, orderBy: { entity: "asc" } }),
      prismaMain.auditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
    ]);
    return {
      entities: entities.map((row) => row.entity),
      actions: actions.map((row) => row.action),
    };
  },
};
