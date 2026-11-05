import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { calculateSkipAndTake } from "@/utils/queryFilters";
import { StudentAttendanceBulkInput, StudentAttendanceCreateInput, StudentAttendanceUpdateInput } from "./validator";


type Actor = { userId?: string; role?: string };

const studentSelect = {
  id: true,
  universityRegNo: true,
  firstName: true,
  middleName: true,
  lastName: true,
  batchId: true,
};

const defaultInclude = {
  session: true,
  student: { select: studentSelect },
};

// A teacher may only touch sessions that belong to them
async function getTeacherIdForUser(userId?: string) {
  if (!userId) return null;
  const teacher = await prismaMain.teacher.findFirst({
    where: { deletedAt: null, employee: { userId, deletedAt: null } },
    select: { id: true },
  });
  return teacher?.id ?? null;
}

// A student may only read their own records
async function getStudentIdForUser(userId?: string) {
  if (!userId) return null;
  const student = await prismaMain.student.findFirst({
    where: { userId, deletedAt: null },
    select: { id: true },
  });
  return student?.id ?? null;
}

// Loads the session, checks it is open and (for teachers) owned by the caller
async function assertSessionWritable(sessionId: string, actor: Actor) {
  const session = await prismaMain.attendanceSession.findFirst({
    where: { id: sessionId, deletedAt: null },
  });

  if (!session) {
    throw new CustomError("Attendance session not found", 404);
  }

  if (session.isLocked) {
    throw new CustomError(
      "This attendance session is locked and cannot be changed",
      423,
    );
  }

  if (actor.role === "TEACHER") {
    const teacherId = await getTeacherIdForUser(actor.userId);
    if (!teacherId || teacherId !== session.teacherId) {
      throw new CustomError(
        "You can only manage attendance for your own sessions",
        403,
      );
    }
  }

  return session;
}

async function assertStudentsExist(studentIds: string[]) {
  const unique = [...new Set(studentIds)];
  const count = await prismaMain.student.count({
    where: { id: { in: unique }, deletedAt: null },
  });

  if (count !== unique.length) {
    throw new CustomError("One or more students were not found", 404);
  }
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
    const limit = query.limit ? query.limit : 10;
    const { skip, take } = calculateSkipAndTake(page, limit);

    const whereClause: any = { deletedAt: null };

    if (query.sessionId) whereClause.sessionId = query.sessionId;
    if (query.status) whereClause.status = query.status;
    if (query.dateBs)
      whereClause.session = { dateBs: query.dateBs, deletedAt: null };

    // Students are always limited to their own attendance
    if (actor.role === "STUDENT") {
      const ownStudentId = await getStudentIdForUser(actor.userId);
      if (!ownStudentId)
        return { data: [], pagination: { page, limit, total: 0 } };
      whereClause.studentId = ownStudentId;
    } else if (query.studentId) {
      whereClause.studentId = query.studentId;
    }

    const studentWhere: any = {};
    if (query.batchId) studentWhere.batchId = query.batchId;
    if (query.search) {
      studentWhere.OR = [
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
        { universityRegNo: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (Object.keys(studentWhere).length > 0) {
      whereClause.student = studentWhere;
    }

    const [records, total] = await Promise.all([
      prismaMain.studentAttendance.findMany({
        where: whereClause,
        skip,
        take,
        include: defaultInclude,
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.studentAttendance.count({ where: whereClause }),
    ]);

    return { data: records, pagination: { page, limit, total } };
  },

  async create(data: StudentAttendanceCreateInput, actor: Actor) {
    await assertSessionWritable(data.sessionId, actor);
    await assertStudentsExist([data.studentId]);

    const existing = await prismaMain.studentAttendance.findFirst({
      where: { sessionId: data.sessionId, studentId: data.studentId },
    });

    if (existing) {
      throw new CustomError(
        "Attendance is already marked for this student in this session",
        409,
      );
    }

    try {
      return await prismaMain.studentAttendance.create({
        data: { ...data, createdBy: actor.userId },
        include: defaultInclude,
      });
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError(
          "Attendance is already marked for this student in this session",
          409,
        );
      }
      throw error;
    }
  },

  // Creates or updates every record for the session in one transaction
  async bulkMark(data: StudentAttendanceBulkInput, actor: Actor) {
    await assertSessionWritable(data.sessionId, actor);

    const studentIds = data.records.map((r) => r.studentId);
    if (new Set(studentIds).size !== studentIds.length) {
      throw new CustomError("Duplicate students found in the request", 400);
    }

    await assertStudentsExist(studentIds);

    await prismaMain.$transaction(
      data.records.map((record) =>
        prismaMain.studentAttendance.upsert({
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
            remarks: record.remarks ?? null,
            createdBy: actor.userId,
          },
          update: {
            status: record.status,
            remarks: record.remarks ?? null,
            deletedAt: null,
            updatedBy: actor.userId,
          },
        }),
      ),
    );

    return prismaMain.studentAttendance.findMany({
      where: { sessionId: data.sessionId, deletedAt: null },
      include: defaultInclude,
      orderBy: { createdAt: "asc" },
    });
  },

  async getById(id: string, actor: Actor) {
    const record = await prismaMain.studentAttendance.findFirst({
      where: { id, deletedAt: null },
      include: defaultInclude,
    });

    if (!record) {
      throw new CustomError("Student attendance not found", 404);
    }

    if (actor.role === "STUDENT") {
      const ownStudentId = await getStudentIdForUser(actor.userId);
      if (record.studentId !== ownStudentId) {
        throw new CustomError("Student attendance not found", 404);
      }
    }

    return record;
  },

  // Totals per status for one student (optionally limited to a date range in BS, YYYY-MM-DD)
  async summary(
    studentId: string,
    range: { fromBs?: string; toBs?: string },
    actor: Actor,
  ) {
    if (actor.role === "STUDENT") {
      const ownStudentId = await getStudentIdForUser(actor.userId);
      if (studentId !== ownStudentId) {
        throw new CustomError("Student not found", 404);
      }
    }

    const student = await prismaMain.student.findFirst({
      where: { id: studentId, deletedAt: null },
      select: studentSelect,
    });

    if (!student) {
      throw new CustomError("Student not found", 404);
    }

    const where: any = { studentId, deletedAt: null };
    if (range.fromBs || range.toBs) {
      where.session = {
        dateBs: {
          ...(range.fromBs ? { gte: range.fromBs } : {}),
          ...(range.toBs ? { lte: range.toBs } : {}),
        },
      };
    }

    const grouped = await prismaMain.studentAttendance.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    });

    const byStatus = grouped.map((g) => ({
      status: g.status,
      count: g._count._all,
    }));

    const totalSessions = byStatus.reduce((sum, s) => sum + s.count, 0);

    return { student, totalSessions, byStatus };
  },

  async update(id: string, data: StudentAttendanceUpdateInput, actor: Actor) {
    const record = await prismaMain.studentAttendance.findFirst({
      where: { id, deletedAt: null },
    });

    if (!record) {
      throw new CustomError("Student attendance not found", 404);
    }

    await assertSessionWritable(record.sessionId, actor);

    return prismaMain.studentAttendance.update({
      where: { id },
      data: { ...data, updatedBy: actor.userId },
      include: defaultInclude,
    });
  },

  async delete(id: string, actor: Actor) {
    const record = await prismaMain.studentAttendance.findFirst({
      where: { id, deletedAt: null },
    });

    if (!record) {
      throw new CustomError("Student attendance not found", 404);
    }

    await assertSessionWritable(record.sessionId, actor);

    await prismaMain.studentAttendance.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: actor.userId },
    });

    return null;
  },
};
