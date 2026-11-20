import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import { getAttendanceEditHours } from "@/lib/settings";
import { todayBs } from "@/utils/bs-date";
import { writeAudit } from "@/lib/audit";
import { type Prisma } from "@/generated/prisma/client";
import {
  AttendanceSessionCreateInput,
  AttendanceSessionUpdateInput,
} from "./validator";

export type Actor = { userId?: string; role?: string };

// NOTE: avoid including `records` via Prisma on legacy normalized DBs where
// student_attendances uses statusId (not enum `status`). Roster is loaded separately.
// Legacy DB compat: avoid `course` (courses.system vs courseSystemId drift).
const SESSION_INCLUDE = {
  teachingAssignment: {
    include: {
      teacher: {
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              middleName: true,
              lastName: true,
              employeeCode: true,
            },
          },
        },
      },
      batchTermSubject: {
        include: {
          subject: { select: { id: true, code: true, name: true } },
          batchTerm: {
            include: {
              batch: { select: { id: true, name: true, courseId: true } },
            },
          },
        },
      },
    },
  },
  teacher: {
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          employeeCode: true,
        },
      },
    },
  },
  period: true,
} as const;

async function getRosterStudents(assignmentId: string) {
  const assignment = await prismaMain.teachingAssignment.findFirst({
    where: { id: assignmentId, deletedAt: null },
    select: {
      batchTermSubject: {
        select: { batchTerm: { select: { batchId: true } } },
      },
    },
  });
  if (!assignment) return [];
  const batchId = assignment.batchTermSubject.batchTerm.batchId;

  return prismaMain.student.findMany({
    where: {
      batchId,
      approvalStatus: "APPROVED",
      status: "ACTIVE",
      deletedAt: null,
    },
    select: {
      id: true,
      universityRegNo: true,
      firstName: true,
      middleName: true,
      lastName: true,
    },
    orderBy: [{ universityRegNo: "asc" }, { firstName: "asc" }],
  });
}

async function getRosterStudentIdsCompat(
  assignmentId: string,
): Promise<string[]> {
  const students = await getRosterStudents(assignmentId);
  return students.map((s) => s.id);
}

async function fillRosterDefaultPresentCompat(
  sessionId: string,
  excludeIds: Set<string> = new Set(),
  userId?: string,
) {
  const session = await prismaMain.attendanceSession.findFirst({
    where: { id: sessionId, deletedAt: null },
    select: { teachingAssignmentId: true },
  });
  if (!session) throw new CustomError("Attendance session not found", 404);
  const rosterIds = await getRosterStudentIdsCompat(
    session.teachingAssignmentId,
  );
  const toCreate = rosterIds.filter((id) => !excludeIds.has(id));
  if (toCreate.length === 0) return;

  await prismaMain.studentAttendance.createMany({
    data: toCreate.map((studentId) => ({
      sessionId,
      studentId,
      status: "PRESENT",
      createdBy: userId ?? null,
    })),
    skipDuplicates: true,
  });
}

/**
 * Persists per-student statuses for a session (one transaction).
 */
async function saveSessionRecords(
  tx: Prisma.TransactionClient,
  sessionId: string,
  records: NonNullable<AttendanceSessionUpdateInput["records"]>,
  userId?: string,
) {
  if (records.length === 0) return;

  for (const record of records) {
    await tx.studentAttendance.upsert({
      where: {
        sessionId_studentId: { sessionId, studentId: record.studentId },
      },
      create: {
        sessionId,
        studentId: record.studentId,
        status: record.status,
        remarks: record.remarks ?? null,
        createdBy: userId,
      },
      update: {
        status: record.status,
        remarks: record.remarks ?? null,
        deletedAt: null,
        updatedBy: userId,
      },
    });
  }
}

async function getTeacherIdForUser(userId?: string): Promise<string | null> {
  if (!userId) return null;
  const teacher = await prismaMain.teacher.findFirst({
    where: { deletedAt: null, employee: { userId, deletedAt: null } },
    select: { id: true },
  });
  return teacher?.id ?? null;
}

export async function applyLazyLock(session: {
  id: string;
  isLocked: boolean;
  createdAt: Date;
}) {
  if (session.isLocked) return true;
  try {
    const editHours = await getAttendanceEditHours();
    const ageHours =
      (Date.now() - new Date(session.createdAt).getTime()) / 3_600_000;
    if (ageHours > editHours) {
      await prismaMain.attendanceSession.update({
        where: { id: session.id },
        data: { isLocked: true, lockedAt: new Date() },
      });
      return true;
    }
  } catch {
    // best-effort
  }
  return false;
}

export async function assertSessionWritableByLock(
  session: { id: string; isLocked: boolean; createdAt: Date },
  role?: string,
) {
  if (role === "ADMIN" || role === "PRINCIPAL") return;
  const locked = session.isLocked || (await applyLazyLock(session));
  if (locked) {
    throw new CustomError(
      "This attendance session is locked (edit window passed). Only PRINCIPAL/ADMIN can unlock.",
      423,
    );
  }
}

export function assertNoFutureDate(dateBs: string) {
  const today = todayBs();
  if (today && dateBs > today) {
    throw new CustomError(
      `Cannot mark attendance for future date ${dateBs} (today is ${today})`,
      400,
    );
  }
}

export async function getRosterStudentIds(
  assignmentId: string,
): Promise<string[]> {
  return getRosterStudentIdsCompat(assignmentId);
}

export async function fillRosterDefaultPresent(
  sessionId: string,
  excludeIds: Set<string> = new Set(),
  userId?: string,
) {
  return fillRosterDefaultPresentCompat(sessionId, excludeIds, userId);
}

export const AttendanceSessionService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: any = { deletedAt: null };
    if (query.search) {
      whereClause.OR = [
        { dateBs: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [sessions, total] = await Promise.all([
      prismaMain.attendanceSession.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: SESSION_INCLUDE,
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.attendanceSession.count({ where: whereClause }),
    ]);

    return { data: sessions, pagination: { page, limit, total } };
  },

  async create(data: AttendanceSessionCreateInput, actor: Actor) {
    assertNoFutureDate(data.dateBs);

    const assignment = await prismaMain.teachingAssignment.findFirst({
      where: { id: data.teachingAssignmentId, deletedAt: null },
    });
    if (!assignment)
      throw new CustomError("Teaching assignment not found", 404);
    if (!assignment.isActive)
      throw new CustomError("Teaching assignment is inactive", 400);

    const [period, teacher] = await Promise.all([
      prismaMain.period.findFirst({
        where: { id: data.periodId, deletedAt: null },
      }),
      prismaMain.teacher.findFirst({
        where: { id: data.teacherId, deletedAt: null },
      }),
    ]);
    if (!period) throw new CustomError("Period not found", 404);
    if (!teacher) throw new CustomError("Teacher not found", 404);

    if (actor.role === "TEACHER") {
      const ownTeacherId = await getTeacherIdForUser(actor.userId);
      if (!ownTeacherId || assignment.teacherId !== ownTeacherId) {
        throw new CustomError(
          "You can only create sessions for your own teaching assignment",
          403,
        );
      }
    }

    const existing = await prismaMain.attendanceSession.findFirst({
      where: {
        teachingAssignmentId: data.teachingAssignmentId,
        periodId: data.periodId,
        dateBs: data.dateBs,
        deletedAt: null,
      },
      include: SESSION_INCLUDE,
    });
    if (existing) return existing;

    try {
      const session = await prismaMain.attendanceSession.create({
        data: {
          teachingAssignmentId: data.teachingAssignmentId,
          teacherId: data.teacherId,
          periodId: data.periodId,
          dateBs: data.dateBs,
          ...(actor.userId && { createdBy: actor.userId }),
        },
        include: SESSION_INCLUDE,
      });
      await fillRosterDefaultPresentCompat(session.id, new Set(), actor.userId);
      return prismaMain.attendanceSession.findFirst({
        where: { id: session.id },
        include: SESSION_INCLUDE,
      });
    } catch (error: any) {
      if (error.code === "P2002") {
        return prismaMain.attendanceSession.findFirst({
          where: {
            teachingAssignmentId: data.teachingAssignmentId,
            periodId: data.periodId,
            dateBs: data.dateBs,
            deletedAt: null,
          },
          include: SESSION_INCLUDE,
        });
      }
      throw error;
    }
  },

  async getById(id: string) {
    const session = await prismaMain.attendanceSession.findFirst({
      where: { id, deletedAt: null },
      include: SESSION_INCLUDE,
    });
    if (!session) throw new CustomError("Attendance session not found", 404);
    const locked = await applyLazyLock(session);
    return { ...session, isLocked: session.isLocked || locked };
  },

  async roster(id: string) {
    const session = await prismaMain.attendanceSession.findFirst({
      where: { id, deletedAt: null },
      include: { teachingAssignment: { select: { id: true } } },
    });
    if (!session) throw new CustomError("Attendance session not found", 404);

    const students = await getRosterStudents(session.teachingAssignmentId);
    const records = await prismaMain.studentAttendance.findMany({
      where: { sessionId: id, deletedAt: null },
      select: {
        id: true,
        sessionId: true,
        studentId: true,
        remarks: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    const recordByStudent = new Map(records.map((r) => [r.studentId, r]));
    return students.map((student: any) => ({
      student: {
        id: student.id,
        universityRegNo: student.universityRegNo,
        firstName: student.firstName,
        middleName: student.middleName,
        lastName: student.lastName,
      },
      record: recordByStudent.get(student.id) ?? null,
    }));
  },

  async update(id: string, data: AttendanceSessionUpdateInput, actor: Actor) {
    const { records, ...sessionData } = data;

    const existing = await prismaMain.attendanceSession.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new CustomError("Attendance session not found", 404);

    await assertSessionWritableByLock(existing, actor.role);
    if (sessionData.dateBs) assertNoFutureDate(sessionData.dateBs);

    if (actor.role === "TEACHER") {
      const ownTeacherId = await getTeacherIdForUser(actor.userId);
      const lockedAssignmentId =
        sessionData.teachingAssignmentId ?? existing.teachingAssignmentId;
      const assignment = await prismaMain.teachingAssignment.findFirst({
        where: { id: lockedAssignmentId, deletedAt: null },
      });
      if (
        !assignment ||
        !ownTeacherId ||
        assignment.teacherId !== ownTeacherId
      ) {
        throw new CustomError(
          "You can only update sessions for your own teaching assignment",
          403,
        );
      }
    }

    if (
      sessionData.teachingAssignmentId ||
      sessionData.periodId ||
      sessionData.dateBs
    ) {
      const dup = await prismaMain.attendanceSession.findFirst({
        where: {
          teachingAssignmentId:
            sessionData.teachingAssignmentId ?? existing.teachingAssignmentId,
          periodId: sessionData.periodId ?? existing.periodId,
          dateBs: sessionData.dateBs ?? existing.dateBs,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (dup)
        throw new CustomError(
          "An attendance session already exists for this assignment, period and date",
          409,
        );
    }

    try {
      // Session metadata + per-student statuses succeed or fail together.
      return await prismaMain.$transaction(async (tx) => {
        const updated = await tx.attendanceSession.update({
          where: { id },
          data: { ...sessionData, updatedBy: actor.userId } as any,
          include: SESSION_INCLUDE,
        });
        if (records && records.length > 0) {
          await saveSessionRecords(tx, id, records, actor.userId);
        }
        return updated;
      });
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError(
          "An attendance session already exists for this assignment, period and date",
          409,
        );
      }
      throw error;
    }
  },

  async unlock(id: string, reason: string, actor: Actor) {
    const trimmedReason = reason?.trim();
    if (!trimmedReason)
      throw new CustomError(
        "A reason is required to unlock an attendance session",
        400,
      );

    const existing = await prismaMain.attendanceSession.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new CustomError("Attendance session not found", 404);

    return prismaMain.$transaction(async (tx) => {
      const session = await tx.attendanceSession.update({
        where: { id },
        data: { isLocked: false, lockedAt: null, updatedBy: actor.userId },
        include: SESSION_INCLUDE,
      });
      await writeAudit(tx, {
        entity: "AttendanceSession",
        entityId: id,
        action: "UNLOCK",
        oldValues: { isLocked: existing.isLocked, lockedAt: existing.lockedAt },
        newValues: { isLocked: false, reason: trimmedReason },
        userId: actor.userId,
      });
      return session;
    });
  },

  async delete(id: string, actor: Actor) {
    const existing = await prismaMain.attendanceSession.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new CustomError("Attendance session not found", 404);
    await assertSessionWritableByLock(existing, actor.role);
    await prismaMain.attendanceSession.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: actor.userId },
    });
    return null;
  },
};
