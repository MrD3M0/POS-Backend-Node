"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoticeService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
const bs_date_1 = require("@/utils/bs-date");
const audience_1 = require("./audience");
/** Roles that may address anybody in the college. */
const BROADCAST_ROLES = ["ADMIN", "PRINCIPAL", "ACCOUNTANT"];
/** Roles that manage notices (they see and edit the whole notice list). */
function isNoticeCreator(role) {
    return Boolean(role && BROADCAST_ROLES.includes(role));
}
/**
 * Audience rules:
 * - ADMIN / PRINCIPAL / ACCOUNTANT may target anyone (or everybody by
 *   sending no target at all).
 * - A TEACHER may only address the classes they teach, and must always pick
 *   at least one class. They can never reach the whole college.
 */
async function assertAudienceAllowed(actor, targets) {
    if (!actor.role || BROADCAST_ROLES.includes(actor.role))
        return;
    if (actor.role === "TEACHER") {
        if (targets.length === 0) {
            throw new CustomError_1.CustomError("Teachers must target at least one of their own classes", 403);
        }
        const allowed = await (0, audience_1.getTeacherBatchIds)(actor.userId);
        for (const target of targets) {
            if (target.role) {
                throw new CustomError_1.CustomError("Teachers may only target their own classes, not roles", 403);
            }
            if (!target.batchId || !allowed.includes(target.batchId)) {
                throw new CustomError_1.CustomError("You may only target classes that you teach", 403);
            }
        }
    }
}
/** A teacher may only change/publish the notices they created themselves. */
async function assertCanManageNotice(actor, notice) {
    if (!actor.role || BROADCAST_ROLES.includes(actor.role))
        return;
    if (actor.role === "TEACHER" && notice.createdBy === actor.userId)
        return;
    throw new CustomError_1.CustomError("You do not have permission to manage this notice", 403);
}
/** Validates target batch references up-front so a bad batch never leaves a half-created notice. */
async function assertTargets(batchIds) {
    if (batchIds.length === 0)
        return;
    const count = await prismaClient_1.prismaMain.batch.count({
        where: { id: { in: [...new Set(batchIds)] }, deletedAt: null },
    });
    if (count !== new Set(batchIds).size)
        throw new CustomError_1.CustomError("One or more target batches were not found", 404);
}
exports.NoticeService = {
    /**
     * Visibility rule: notices are visible only when published AND not expired
     * (expiresOnBs >= today). Pinned notices sort first, then newest publishedAt.
     * Targeting: a notice with no targets is visible to everyone; otherwise it
     * must match the actor's role and/or their batch.
     * ADMIN/PRINCIPAL may pass showDrafts=true to also see unpublished/expired.
     */
    async index(query, actor) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const privileged = actor.role === "ADMIN" || actor.role === "PRINCIPAL";
        const today = (0, bs_date_1.todayBs)();
        const whereClause = { deletedAt: null };
        if (!query.showDrafts || !privileged) {
            whereClause.isPublished = true;
            if (today) {
                whereClause.OR = [{ expiresOnBs: null }, { expiresOnBs: { gte: today } }];
            }
        }
        if (query.search) {
            const searchClause = {
                OR: [
                    { title: { contains: query.search, mode: "insensitive" } },
                    { body: { contains: query.search, mode: "insensitive" } },
                ],
            };
            whereClause.AND = [
                whereClause.OR ? { OR: whereClause.OR } : {},
                searchClause,
            ];
            delete whereClause.OR;
        }
        // Target filter: no targets (everyone) OR role match OR batch match OR
        // I created it (the author always sees their own notice).
        // Notice creators (admin / principal / accountant) manage the whole notice
        // list, so they are not filtered by the audience.
        if (!isNoticeCreator(actor.role)) {
            const audience = await (0, audience_1.buildAudienceClause)(actor);
            whereClause.AND = [...(whereClause.AND ?? []), audience];
        }
        const [notices, total] = await Promise.all([
            prismaClient_1.prismaMain.notice.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: { targets: true },
                orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
            }),
            prismaClient_1.prismaMain.notice.count({ where: whereClause }),
        ]);
        return { data: notices, pagination: { page, limit, total } };
    },
    async create(data, userId, actor) {
        const batchIds = (data.targets ?? []).map((t) => t.batchId).filter(Boolean);
        await assertTargets(batchIds);
        // A teacher may only address their own classes; the other notice creators
        // may address anyone (or everybody by sending no target).
        await assertAudienceAllowed(actor ?? { userId }, (data.targets ?? []));
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            const notice = await tx.notice.create({
                data: {
                    title: data.title,
                    body: data.body,
                    attachmentUrl: data.attachmentUrl ?? null,
                    isPinned: data.isPinned ?? false,
                    isPublished: data.isPublished ?? false,
                    publishedAt: data.isPublished ? new Date() : null,
                    expiresOnBs: data.expiresOnBs ?? null,
                    createdBy: userId,
                },
            });
            if (data.targets && data.targets.length > 0) {
                await tx.noticeTarget.createMany({
                    data: data.targets.map((t) => ({
                        noticeId: notice.id,
                        role: t.role ?? null,
                        batchId: t.batchId ?? null,
                        createdBy: userId ?? null,
                    })),
                });
            }
            return tx.notice.findFirst({ where: { id: notice.id }, include: { targets: true } });
        });
    },
    async getById(id, actor) {
        const notice = await prismaClient_1.prismaMain.notice.findFirst({
            where: { id, deletedAt: null },
            include: { targets: true },
        });
        if (!notice)
            throw new CustomError_1.CustomError("Notice not found", 404);
        // Notice creators (admin / principal / accountant) manage every notice.
        const privileged = isNoticeCreator(actor?.role);
        const today = (0, bs_date_1.todayBs)();
        const visible = notice.isPublished && (!notice.expiresOnBs || !today || notice.expiresOnBs >= today);
        if (!visible && !privileged)
            throw new CustomError_1.CustomError("Notice not found", 404);
        // Targeting check for non-privileged callers (the author always passes)
        if (!privileged && notice.targets.length > 0 && notice.createdBy !== actor?.userId) {
            const batchId = await (0, audience_1.getStudentBatchId)(actor?.userId);
            const matches = notice.targets.some((t) => (t.role && t.role === actor?.role) || (t.batchId && batchId && t.batchId === batchId));
            if (!matches)
                throw new CustomError_1.CustomError("Notice not found", 404);
        }
        return notice;
    },
    async update(id, data, userId, actor) {
        const existing = await prismaClient_1.prismaMain.notice.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Notice not found", 404);
        // A teacher may only edit their own notices.
        await assertCanManageNotice(actor ?? { userId }, existing);
        const batchIds = (data.targets ?? []).map((t) => t.batchId).filter(Boolean);
        await assertTargets(batchIds);
        // The new audience must still obey the role rules (teacher → own classes).
        await assertAudienceAllowed(actor ?? { userId }, (data.targets ?? []));
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            const patch = { updatedBy: userId };
            if (data.title !== undefined)
                patch.title = data.title;
            if (data.body !== undefined)
                patch.body = data.body;
            if (data.attachmentUrl !== undefined)
                patch.attachmentUrl = data.attachmentUrl;
            if (data.isPinned !== undefined)
                patch.isPinned = data.isPinned;
            if (data.expiresOnBs !== undefined)
                patch.expiresOnBs = data.expiresOnBs;
            if (data.isPublished !== undefined) {
                patch.isPublished = data.isPublished;
                // publishedAt is set on publish, cleared on unpublish
                patch.publishedAt = data.isPublished ? new Date() : null;
            }
            await tx.notice.update({ where: { id }, data: patch });
            if (data.targets !== undefined) {
                await tx.noticeTarget.deleteMany({ where: { noticeId: id } });
                if (data.targets && data.targets.length > 0) {
                    await tx.noticeTarget.createMany({
                        data: data.targets.map((t) => ({
                            noticeId: id,
                            role: t.role ?? null,
                            batchId: t.batchId ?? null,
                            createdBy: userId ?? null,
                        })),
                    });
                }
            }
            return tx.notice.findFirst({ where: { id }, include: { targets: true } });
        });
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.notice.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Notice not found", 404);
        await prismaClient_1.prismaMain.notice.update({
            where: { id },
            data: { deletedAt: new Date(), updatedBy: userId },
        });
        return null;
    },
    async previewAudience(id) {
        const notice = await prismaClient_1.prismaMain.notice.findFirst({
            where: { id, deletedAt: null },
            include: { targets: true },
        });
        if (!notice)
            throw new CustomError_1.CustomError("Notice not found", 404);
        if (notice.targets.length === 0) {
            const total = await prismaClient_1.prismaMain.user.count({ where: { deletedAt: null, isActive: true } });
            return { mode: "everyone", count: total, targets: [] };
        }
        const roleTargets = notice.targets.map((target) => target.role).filter(Boolean);
        const batchTargets = notice.targets.map((target) => target.batchId).filter(Boolean);
        const where = { deletedAt: null, isActive: true };
        const ors = [];
        if (roleTargets.length)
            ors.push({ role: { in: roleTargets } });
        if (batchTargets.length)
            ors.push({ student: { batchId: { in: batchTargets } } });
        if (ors.length)
            where.OR = ors;
        const count = await prismaClient_1.prismaMain.user.count({ where });
        return { mode: "targeted", count, targets: notice.targets };
    },
    async publish(id, userId, actor) {
        const existing = await prismaClient_1.prismaMain.notice.findFirst({
            where: { id, deletedAt: null },
            include: { targets: true },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Notice not found", 404);
        // A teacher may only publish their own notices.
        await assertCanManageNotice(actor ?? { userId }, existing);
        // Publishing a teacher's notice must still respect their audience limit.
        await assertAudienceAllowed(actor ?? { userId }, (existing.targets ?? []));
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            const notice = await tx.notice.update({
                where: { id },
                data: { isPublished: true, publishedAt: new Date(), updatedBy: userId },
                include: { targets: true },
            });
            const { writeAudit } = await Promise.resolve().then(() => __importStar(require("@/lib/audit")));
            await writeAudit(tx, { entity: "Notice", entityId: id, action: "PUBLISH", newValues: { isPublished: true }, userId });
            return notice;
        });
    },
    async unpublish(id, userId, actor) {
        const existing = await prismaClient_1.prismaMain.notice.findFirst({ where: { id, deletedAt: null } });
        if (!existing)
            throw new CustomError_1.CustomError("Notice not found", 404);
        // A teacher may only unpublish their own notices.
        await assertCanManageNotice(actor ?? { userId }, existing);
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            const notice = await tx.notice.update({
                where: { id },
                data: { isPublished: false, publishedAt: null, updatedBy: userId },
                include: { targets: true },
            });
            const { writeAudit } = await Promise.resolve().then(() => __importStar(require("@/lib/audit")));
            await writeAudit(tx, { entity: "Notice", entityId: id, action: "UNPUBLISH", newValues: { isPublished: false }, userId });
            return notice;
        });
    },
};
