import { prismaMain } from "@/lib/prismaClient";

export type NoticeActor = { userId?: string; role?: string };

export type NoticeTargetInput = {
  role?: string | null;
  batchId?: string | null;
};

/** The batch of the signed-in student (students see notices aimed at their class). */
export async function getStudentBatchId(userId?: string): Promise<string | null> {
  if (!userId) return null;
  const student = await prismaMain.student.findFirst({
    where: { userId, deletedAt: null },
    select: { batchId: true },
  });
  return student?.batchId ?? null;
}

/**
 * Who may see a notice:
 * - no targets at all            → everyone
 * - a target for my role          → me
 * - a target for my batch          → me (students of that class)
 * - I created it                  → always me, so the author can follow it up
 */
export async function buildAudienceClause(actor: NoticeActor) {
  const batchId = await getStudentBatchId(actor.userId);
  const or: any[] = [{ targets: { none: {} } }];
  if (actor.role) {
    or.push({ targets: { some: { role: actor.role, deletedAt: null } } });
  }
  if (batchId) {
    or.push({ targets: { some: { batchId, deletedAt: null } } });
  }
  if (actor.userId) {
    or.push({ createdBy: actor.userId });
  }
  return { OR: or };
}

/** Batches (classes) the signed-in teacher teaches. */
export async function getTeacherBatchIds(userId?: string): Promise<string[]> {
  if (!userId) return [];
  const assignments = await prismaMain.teachingAssignment.findMany({
    where: {
      deletedAt: null,
      teacher: { employee: { userId, deletedAt: null } },
    },
    select: {
      batchTermSubject: { select: { batchTerm: { select: { batchId: true } } } },
    },
  });
  const ids = assignments
    .map((a) => a.batchTermSubject?.batchTerm?.batchId)
    .filter((id): id is string => Boolean(id));
  return [...new Set(ids)];
}
