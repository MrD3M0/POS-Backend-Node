import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import { todayBs } from "@/utils/bs-date";
import { NoticeCreateInput, NoticeUpdateInput } from "./validator";
import {
  buildAudienceClause,
  getStudentBatchId,
  getTeacherBatchIds,
  type NoticeActor,
  type NoticeTargetInput,
} from "./audience";

type Actor = { userId?: string; role?: string };

/** Roles that may address anybody in the college. */
const BROADCAST_ROLES = ["ADMIN", "PRINCIPAL", "ACCOUNTANT"];

/** Roles that manage notices (they see and edit the whole notice list). */
function isNoticeCreator(role?: string): boolean {
  return Boolean(role && BROADCAST_ROLES.includes(role));
}

/**
 * Audience rules:
 * - ADMIN / PRINCIPAL / ACCOUNTANT may target anyone (or everybody by
 *   sending no target at all).
 * - A TEACHER may only address the classes they teach, and must always pick
 *   at least one class. They can never reach the whole college.
 */
async function assertAudienceAllowed(
  actor: Actor,
  targets: NoticeTargetInput[],
) {
  if (!actor.role || BROADCAST_ROLES.includes(actor.role)) return;

  if (actor.role === "TEACHER") {
    if (targets.length === 0) {
      throw new CustomError(
        "Teachers must target at least one of their own classes",
        403,
      );
    }
    const allowed = await getTeacherBatchIds(actor.userId);
    for (const target of targets) {
      if (target.role) {
        throw new CustomError(
          "Teachers may only target their own classes, not roles",
          403,
        );
      }
      if (!target.batchId || !allowed.includes(target.batchId)) {
        throw new CustomError(
          "You may only target classes that you teach",
          403,
        );
      }
    }
  }
}

/** A teacher may only change/publish the notices they created themselves. */
async function assertCanManageNotice(
  actor: Actor,
  notice: { createdBy?: string | null },
) {
  if (!actor.role || BROADCAST_ROLES.includes(actor.role)) return;
  if (actor.role === "TEACHER" && notice.createdBy === actor.userId) return;
  throw new CustomError(
    "You do not have permission to manage this notice",
    403,
  );
}

/** Validates target batch references up-front so a bad batch never leaves a half-created notice. */
async function assertTargets(batchIds: string[]) {
  if (batchIds.length === 0) return;
  const count = await prismaMain.batch.count({
    where: { id: { in: [...new Set(batchIds)] }, deletedAt: null },
  });
  if (count !== new Set(batchIds).size) throw new CustomError("One or more target batches were not found", 404);
}

export const NoticeService = {
  /**
   * Visibility rule: notices are visible only when published AND not expired
   * (expiresOnBs >= today). Pinned notices sort first, then newest publishedAt.
   * Targeting: a notice with no targets is visible to everyone; otherwise it
   * must match the actor's role and/or their batch.
   * ADMIN/PRINCIPAL may pass showDrafts=true to also see unpublished/expired.
   */
  async index(
    query: { page?: number; limit?: number; search?: string; showDrafts?: boolean },
    actor: Actor,
  ) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const privileged = actor.role === "ADMIN" || actor.role === "PRINCIPAL";
    const today = todayBs();

    const whereClause: any = { deletedAt: null };
    if (!query.showDrafts || !privileged) {
      whereClause.isPublished = true;
      if (today) {
        whereClause.OR = [{ expiresOnBs: null }, { expiresOnBs: { gte: today } }];
      }
    }

    if (query.search) {
      const searchClause: any = {
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
      const audience = await buildAudienceClause(actor);
      whereClause.AND = [...(whereClause.AND ?? []), audience];
    }

    const [notices, total] = await Promise.all([
      prismaMain.notice.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: { targets: true },
        orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      }),
      prismaMain.notice.count({ where: whereClause }),
    ]);

    return { data: notices, pagination: { page, limit, total } };
  },

  async create(data: NoticeCreateInput, userId?: string, actor?: Actor) {
    const batchIds = (data.targets ?? []).map((t) => t.batchId).filter(Boolean) as string[];
    await assertTargets(batchIds);
    // A teacher may only address their own classes; the other notice creators
    // may address anyone (or everybody by sending no target).
    await assertAudienceAllowed(actor ?? { userId }, (data.targets ?? []) as NoticeTargetInput[]);

    return prismaMain.$transaction(async (tx) => {
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

  async getById(id: string, actor?: Actor) {
    const notice = await prismaMain.notice.findFirst({
      where: { id, deletedAt: null },
      include: { targets: true },
    });
    if (!notice) throw new CustomError("Notice not found", 404);

    // Notice creators (admin / principal / accountant) manage every notice.
    const privileged = isNoticeCreator(actor?.role);
    const today = todayBs();
    const visible =
      notice.isPublished && (!notice.expiresOnBs || !today || notice.expiresOnBs >= today);
    if (!visible && !privileged) throw new CustomError("Notice not found", 404);

    // Targeting check for non-privileged callers (the author always passes)
    if (!privileged && notice.targets.length > 0 && notice.createdBy !== actor?.userId) {
      const batchId = await getStudentBatchId(actor?.userId);
      const matches = notice.targets.some(
        (t) =>
          (t.role && t.role === actor?.role) || (t.batchId && batchId && t.batchId === batchId),
      );
      if (!matches) throw new CustomError("Notice not found", 404);
    }

    return notice;
  },

  async update(id: string, data: NoticeUpdateInput, userId?: string, actor?: Actor) {
    const existing = await prismaMain.notice.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new CustomError("Notice not found", 404);

    // A teacher may only edit their own notices.
    await assertCanManageNotice(actor ?? { userId }, existing);

    const batchIds = (data.targets ?? []).map((t) => t.batchId).filter(Boolean) as string[];
    await assertTargets(batchIds);
    // The new audience must still obey the role rules (teacher → own classes).
    await assertAudienceAllowed(actor ?? { userId }, (data.targets ?? []) as NoticeTargetInput[]);

    return prismaMain.$transaction(async (tx) => {
      const patch: any = { updatedBy: userId };
      if (data.title !== undefined) patch.title = data.title;
      if (data.body !== undefined) patch.body = data.body;
      if (data.attachmentUrl !== undefined) patch.attachmentUrl = data.attachmentUrl;
      if (data.isPinned !== undefined) patch.isPinned = data.isPinned;
      if (data.expiresOnBs !== undefined) patch.expiresOnBs = data.expiresOnBs;
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

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.notice.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new CustomError("Notice not found", 404);
    await prismaMain.notice.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
    return null;
  },

  async previewAudience(id: string) {
    const notice = await prismaMain.notice.findFirst({
      where: { id, deletedAt: null },
      include: { targets: true },
    });
    if (!notice) throw new CustomError("Notice not found", 404);
    if (notice.targets.length === 0) {
      const total = await prismaMain.user.count({ where: { deletedAt: null, isActive: true } });
      return { mode: "everyone", count: total, targets: [] };
    }
    const roleTargets = notice.targets.map((target) => target.role).filter(Boolean) as string[];
    const batchTargets = notice.targets.map((target) => target.batchId).filter(Boolean) as string[];
    const where: Record<string, unknown> = { deletedAt: null, isActive: true };
    const ors: Record<string, unknown>[] = [];
    if (roleTargets.length) ors.push({ role: { in: roleTargets } });
    if (batchTargets.length) ors.push({ student: { batchId: { in: batchTargets } } });
    if (ors.length) where.OR = ors;
    const count = await prismaMain.user.count({ where });
    return { mode: "targeted", count, targets: notice.targets };
  },

  async publish(id: string, userId?: string, actor?: Actor) {
    const existing = await prismaMain.notice.findFirst({
      where: { id, deletedAt: null },
      include: { targets: true },
    });
    if (!existing) throw new CustomError("Notice not found", 404);
    // A teacher may only publish their own notices.
    await assertCanManageNotice(actor ?? { userId }, existing);
    // Publishing a teacher's notice must still respect their audience limit.
    await assertAudienceAllowed(
      actor ?? { userId },
      (existing.targets ?? []) as NoticeTargetInput[],
    );
    return prismaMain.$transaction(async (tx) => {
      const notice = await tx.notice.update({
        where: { id },
        data: { isPublished: true, publishedAt: new Date(), updatedBy: userId },
        include: { targets: true },
      });
      const { writeAudit } = await import("@/lib/audit");
      await writeAudit(tx, { entity: "Notice", entityId: id, action: "PUBLISH", newValues: { isPublished: true }, userId });
      return notice;
    });
  },

  async unpublish(id: string, userId?: string, actor?: Actor) {
    const existing = await prismaMain.notice.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new CustomError("Notice not found", 404);
    // A teacher may only unpublish their own notices.
    await assertCanManageNotice(actor ?? { userId }, existing);
    return prismaMain.$transaction(async (tx) => {
      const notice = await tx.notice.update({
        where: { id },
        data: { isPublished: false, publishedAt: null, updatedBy: userId },
        include: { targets: true },
      });
      const { writeAudit } = await import("@/lib/audit");
      await writeAudit(tx, { entity: "Notice", entityId: id, action: "UNPUBLISH", newValues: { isPublished: false }, userId });
      return notice;
    });
  },
};
