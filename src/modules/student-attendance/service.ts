import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { calculateSkipAndTake, resolvePageLimit } from "@/utils/queryFilters";
import {
  AttendanceStatus,
  type Prisma,
} from "@/generated/prisma/client";
import {
  StudentAttendanceBulkInput,
  StudentAttendanceCreateInput,
  StudentAttendanceUpdateInput,
} from "./validator";
import { studentHolidayDateBs } from "@/modules/holiday/service";

type Actor = { userId?: string; role?: string };

const studentSelect = {
  id: true,
  universityRegNo: true,
  firstName: true,
  middleName: true,
  lastName: true,
  batchId: true,
} as const;

const defaultInclude = {
  session: true,
  student: { select: studentSelect },
} as const;

// Salary factor per status: PRESENT/LATE = 1, LEAVE/ABSENT = 0.
export const ATTENDANCE_FACTOR: Record<string, number> = {
  PRESENT: 1,
  LATE: 1,
  LEAVE: 0,
  ABSENT: 0,
};

async function getTeacherIdForUser(userId?: string): Promise<string | null> {
  if (!userId) return null;
  const teacher = await prismaMain.teacher.findFirst({
    where: { deletedAt: null, employee: { userId, deletedAt: null } },
    select: { id: true },
  });
  return teacher?.id ?? null;
}

async function getStudentIdForUser(userId?: string): Promise<string | null> {
  if (!userId) return null;
  const student = await prismaMain.student.findFirst({
    where: { userId, deletedAt: null },
    select: { id: true },
  });
  return student?.id ?? null;
}

async function assertSessionWritable(sessionId: string, actor: Actor) {
  const session = await prismaMain.attendanceSession.findFirst({
    where: { id: sessionId, deletedAt: null },
  });
  if (!session) throw new CustomError("Attendance session not found", 404);

  if (actor.role !== "ADMIN" && actor.role !== "PRINCIPAL") {
    const editHours = await (
      await import("@/lib/settings")
    )
      .getAttendanceEditHours()
      .catch(() => 24);
    const ageHours =
      (Date.now() - new Date(session.createdAt).getTime()) / 3_600_000;
    if (session.isLocked || ageHours > editHours) {
      if (!session.isLocked) {
        await prismaMain.attendanceSession
          .update({
            where: { id: sessionId },
            data: { isLocked: true, lockedAt: new Date() },
          })
          .catch(() => {});
      }
      throw new CustomError(
        "This attendance session is locked (edit window passed). Only PRINCIPAL/ADMIN can unlock.",
        423,
      );
    }
  }

  if (actor.role === "TEACHER") {
    const teacherId = await getTeacherIdForUser(actor.userId);
    const assignment = await prismaMain.teachingAssignment.findFirst({
      where: { id: session.teachingAssignmentId, deletedAt: null },
      select: { teacherId: true },
    });
    if (!teacherId || !assignment || assignment.teacherId !== teacherId) {
      throw new CustomError(
        "You can only manage attendance for sessions of your own teaching assignment",
        403,
      );
    }
  }

  return session;
}

async function getRoster(
  sessionId: string,
): Promise<{ session: any; rosterIds: Set<string> }> {
  const session = await prismaMain.attendanceSession.findFirst({
    where: { id: sessionId, deletedAt: null },
    include: {
      teachingAssignment: {
        include: { batchTermSubject: { include: { batchTerm: true } } },
      },
    },
  });
  if (!session) throw new CustomError("Attendance session not found", 404);

  const batchId = session.teachingAssignment.batchTermSubject.batchTerm.batchId;
  const students = await prismaMain.student.findMany({
    where: {
      batchId,
      approvalStatus: "APPROVED",
      status: "ACTIVE",
      deletedAt: null,
    },
    select: { id: true },
  });
  return { session, rosterIds: new Set(students.map((s) => s.id)) };
}

function assertInRoster(studentIds: string[], rosterIds: Set<string>) {
  const notInRoster = studentIds.filter((id) => !rosterIds.has(id));
  if (notInRoster.length > 0) {
    throw new CustomError(
      `Students not in the session roster (APPROVED+ACTIVE batch students): ${notInRoster.join(", ")}`,
      422,
    );
  }
}

function fetchSessionRecords(sessionId: string) {
  return prismaMain.studentAttendance.findMany({
    where: { sessionId, deletedAt: null },
    include: defaultInclude,
    orderBy: { student: { universityRegNo: "asc" } },
  });
}

export const StudentAttendanceService = {
  async index(
    query: {
      page?: number;
      limit?: number;
      search?: string;
      sessionId?: string;
      studentId?: string;
      status?: string;
      batchId?: string;
      dateBs?: string;
    },
    actor: Actor,
  ) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const { skip, take } = calculateSkipAndTake(page, limit);

    const whereClause: Prisma.StudentAttendanceWhereInput = { deletedAt: null };
    if (query.sessionId) whereClause.sessionId = query.sessionId;
    if (query.status) whereClause.status = query.status as AttendanceStatus;
    if (query.dateBs) {
      whereClause.session = { is: { dateBs: query.dateBs, deletedAt: null } };
    }

    if (actor.role === "STUDENT") {
      const ownStudentId = await getStudentIdForUser(actor.userId);
      if (!ownStudentId)
        return { data: [], pagination: { page, limit, total: 0 } };
      whereClause.studentId = ownStudentId;
    } else if (query.studentId) {
      whereClause.studentId = query.studentId;
    }

    if (query.batchId) {
      whereClause.student = { is: { batchId: query.batchId } };
    }

    const [records, total] = await Promise.all([
      prismaMain.studentAttendance.findMany({
        where: whereClause,
        skip,
        take,
        include: defaultInclude,
        orderBy: query.sessionId
          ? { student: { universityRegNo: "asc" } }
          : { createdAt: "desc" },
      }),
      prismaMain.studentAttendance.count({ where: whereClause }),
    ]);

    return { data: records, pagination: { page, limit, total } };
  },

  async create(data: StudentAttendanceCreateInput, actor: Actor) {
    await assertSessionWritable(data.sessionId, actor);
    const { rosterIds } = await getRoster(data.sessionId);
    assertInRoster([data.studentId], rosterIds);

    const existing = await prismaMain.studentAttendance.findFirst({
      where: {
        sessionId: data.sessionId,
        studentId: data.studentId,
        deletedAt: null,
      },
    });
    if (existing)
      throw new CustomError(
        "Attendance is already marked for this student in this session",
        409,
      );

    return prismaMain.studentAttendance.create({
      data: {
        sessionId: data.sessionId,
        studentId: data.studentId,
        status: data.status,
        remarks: data.remarks ?? null,
        createdBy: actor.userId,
      },
      include: defaultInclude,
    });
  },

  async bulkMark(data: StudentAttendanceBulkInput, actor: Actor) {
    await assertSessionWritable(data.sessionId, actor);

    const studentIds = data.records.map((r) => r.studentId);
    if (new Set(studentIds).size !== studentIds.length) {
      throw new CustomError("Duplicate students found in the request", 400);
    }

    const { rosterIds } = await getRoster(data.sessionId);
    assertInRoster(studentIds, rosterIds);

    const explicitIds = new Set(studentIds);
    const defaulted = [...rosterIds]
      .filter((id) => !explicitIds.has(id))
      .map((studentId) => ({
        studentId,
        status: AttendanceStatus.PRESENT,
        remarks: null as string | null,
      }));

    const allRecords = [
      ...data.records.map((r) => ({
        studentId: r.studentId,
        status: r.status as AttendanceStatus,
        remarks: r.remarks ?? null,
      })),
      ...defaulted,
    ];

    await prismaMain.$transaction(async (tx) => {
      for (const record of allRecords) {
        await tx.studentAttendance.upsert({
          where: {
            sessionId_studentId: {
              sessionId: data.sessionId,
              studentId: record.studentId,
            },
          },
          create: {
            sessionId: data.sessionId,
            studentId: record.studentId,
            status: record.status,
            remarks: record.remarks,
            createdBy: actor.userId,
          },
          update: {
            status: record.status,
            remarks: record.remarks,
            deletedAt: null,
            updatedBy: actor.userId,
          },
        });
      }
    });

    return fetchSessionRecords(data.sessionId);
  },

  async getById(id: string, actor: Actor) {
    const record = await prismaMain.studentAttendance.findFirst({
      where: { id, deletedAt: null },
      include: defaultInclude,
    });
    if (!record) throw new CustomError("Student attendance not found", 404);
    if (actor.role === "STUDENT") {
      const ownStudentId = await getStudentIdForUser(actor.userId);
      if (record.studentId !== ownStudentId)
        throw new CustomError("Student attendance not found", 404);
    }
    return record;
  },

  async summary(
    studentId: string,
    range: { fromBs?: string; toBs?: string },
    actor: Actor,
  ) {
    if (actor.role === "STUDENT") {
      const ownStudentId = await getStudentIdForUser(actor.userId);
      if (studentId !== ownStudentId)
        throw new CustomError("Student not found", 404);
    }

    const student = await prismaMain.student.findFirst({
      where: { id: studentId, deletedAt: null },
      select: studentSelect,
    });
    if (!student) throw new CustomError("Student not found", 404);

    const where: Prisma.StudentAttendanceWhereInput = {
      studentId,
      deletedAt: null,
    };

    // Sessions held on student holidays are not working days: they count
    // toward neither the numerator nor the denominator of attendance %.
    const holidayDateBs = [
      ...(await studentHolidayDateBs(range.fromBs || range.toBs ? range : undefined)),
    ];

    const sessionDateBs: Prisma.StringFilter = {};
    if (range.fromBs) sessionDateBs.gte = range.fromBs;
    if (range.toBs) sessionDateBs.lte = range.toBs;
    if (holidayDateBs.length > 0) sessionDateBs.notIn = holidayDateBs;
    if (Object.keys(sessionDateBs).length > 0) {
      where.session = { is: { dateBs: sessionDateBs } };
    }

    const grouped = await prismaMain.studentAttendance.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    });

    const byStatus = grouped.map((g) => ({
      status: g.status,
      count: g._count._all,
      factor: ATTENDANCE_FACTOR[g.status] ?? 0,
    }));
    const totalSessions = byStatus.reduce((sum, s) => sum + s.count, 0);
    const presentDays = byStatus.reduce(
      (sum, s) => sum + s.count * s.factor,
      0,
    );
    const attendancePercent =
      totalSessions === 0
        ? 0
        : Math.round((presentDays / totalSessions) * 10000) / 100;

    return { student, totalSessions, byStatus, presentDays, attendancePercent };
  },

  async update(id: string, data: StudentAttendanceUpdateInput, actor: Actor) {
    const record = await prismaMain.studentAttendance.findFirst({
      where: { id, deletedAt: null },
    });
    if (!record) throw new CustomError("Student attendance not found", 404);
    await assertSessionWritable(record.sessionId, actor);

    return prismaMain.studentAttendance.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.remarks !== undefined ? { remarks: data.remarks } : {}),
        updatedBy: actor.userId,
      },
      include: defaultInclude,
    });
  },

  async delete(id: string, actor: Actor) {
    const record = await prismaMain.studentAttendance.findFirst({
      where: { id, deletedAt: null },
    });
    if (!record) throw new CustomError("Student attendance not found", 404);
    await assertSessionWritable(record.sessionId, actor);
    await prismaMain.studentAttendance.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: actor.userId },
    });
    return null;
  },
};
