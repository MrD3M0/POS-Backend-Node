import { prismaMain } from "@/lib/prismaClient";
import { toPrismaTake } from "@/utils/queryFilters";
import { todayBs } from "@/utils/bs-date";
import { buildAudienceClause } from "@/modules/notice/audience";

export type T_NotificationActor = { userId?: string; role?: string };

export type T_NotificationItem = {
  id: string;
  type: "NOTICE" | "ALERT";
  title: string;
  body?: string | null;
  link: string;
  severity: "info" | "warning" | "success";
  createdAt: string;
};

const NOTICE_LINK: Record<string, string> = {
  ADMIN: "/admin/notices",
  PRINCIPAL: "/principal/notices",
  ACCOUNTANT: "/accountant/notices",
  TEACHER: "/teacher/notices",
  STAFF: "/staff/notices",
  STUDENT: "/notices",
};

/** Recent published notices that are meant for this user. */
async function noticeItems(
  actor: T_NotificationActor,
  limit: number,
): Promise<T_NotificationItem[]> {
  const today = todayBs();
  const audience = await buildAudienceClause(actor);

  const where: any = {
    deletedAt: null,
    isPublished: true,
    AND: [audience],
  };
  if (today) {
    where.AND.push({
      OR: [{ expiresOnBs: null }, { expiresOnBs: { gte: today } }],
    });
  }

  const notices = await prismaMain.notice.findMany({
    where,
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    take: toPrismaTake(limit),
    select: {
      id: true,
      title: true,
      body: true,
      publishedAt: true,
      createdAt: true,
    },
  });

  const link = NOTICE_LINK[actor.role ?? ""] ?? "/notices";
  return notices.map((n) => ({
    id: `notice:${n.id}`,
    type: "NOTICE" as const,
    title: n.title,
    body: n.body,
    link,
    severity: "info" as const,
    createdAt: (n.publishedAt ?? n.createdAt).toISOString(),
  }));
}

/** Teacher: today's attendance that has not been taken yet. */
async function teacherPendingAttendance(
  teacherId: string,
): Promise<number> {
  const today = todayBs();
  if (!today) return 0;
  const sessions = await prismaMain.attendanceSession.findMany({
    where: { teacherId, dateBs: today, deletedAt: null },
    select: { id: true },
  });
  if (sessions.length === 0) return 0;
  const counts = await prismaMain.studentAttendance.groupBy({
    by: ["sessionId"],
    where: { sessionId: { in: sessions.map((s) => s.id) } },
    _count: { _all: true },
  });
  const countBySession = new Map(
    counts.map((row) => [row.sessionId, row._count._all]),
  );
  return sessions.filter((s) => (countBySession.get(s.id) ?? 0) === 0).length;
}

/** Teacher: exam subjects of their classes where no marks were entered yet. */
async function teacherPendingMarks(teacherId: string): Promise<number> {
  const examSubjects = await prismaMain.examSubject.findMany({
    where: {
      deletedAt: null,
      batchTermSubject: {
        assignments: { some: { teacherId, deletedAt: null } },
      },
    },
    select: { id: true },
  });
  if (examSubjects.length === 0) return 0;
  const counts = await prismaMain.examMark.groupBy({
    by: ["examSubjectId"],
    where: { examSubjectId: { in: examSubjects.map((e) => e.id) } },
    _count: { _all: true },
  });
  const countBySubject = new Map(
    counts.map((row) => [row.examSubjectId, row._count._all]),
  );
  return examSubjects.filter((e) => (countBySubject.get(e.id) ?? 0) === 0).length;
}

/**
 * The dashboard alerts of the current role. These are the same counters the
 * dashboards show, so the bell never disagrees with the page.
 */
async function alertItems(
  actor: T_NotificationActor,
): Promise<T_NotificationItem[]> {
  const now = new Date().toISOString();
  const items: T_NotificationItem[] = [];

  if (actor.role === "TEACHER") {
    const teacher = await prismaMain.teacher.findFirst({
      where: {
        deletedAt: null,
        employee: { userId: actor.userId ?? "", deletedAt: null },
      },
      select: { id: true },
    });
    if (teacher) {
      const pendingAttendance = await teacherPendingAttendance(teacher.id);
      if (pendingAttendance > 0) {
        items.push({
          id: "alert:teacher-attendance",
          type: "ALERT",
          title: `Attendance pending for ${pendingAttendance} session${pendingAttendance === 1 ? "" : "s"}`,
          body: "Take today's attendance so the students are marked present.",
          link: "/teacher/take-attendance",
          severity: "warning",
          createdAt: now,
        });
      }

      const pendingMarks = await teacherPendingMarks(teacher.id);
      if (pendingMarks > 0) {
        items.push({
          id: "alert:teacher-marks",
          type: "ALERT",
          title: `Marks not entered for ${pendingMarks} exam subject${pendingMarks === 1 ? "" : "s"}`,
          body: "Enter the marks of your exam subjects to publish results.",
          link: "/teacher/marks",
          severity: "warning",
          createdAt: now,
        });
      }
    }
    return items;
  }

  if (actor.role === "PRINCIPAL") {
    const pendingResults = await prismaMain.result.count({
      where: { status: "PENDING", deletedAt: null },
    });
    if (pendingResults > 0) {
      items.push({
        id: "alert:principal-results",
        type: "ALERT",
        title: `${pendingResults} result${pendingResults === 1 ? "" : "s"} waiting for approval`,
        body: "Review and approve the results submitted by teachers.",
        link: "/principal/results/pending",
        severity: "warning",
        createdAt: now,
      });
    }
    const pendingPayroll = await prismaMain.payroll.count({
      where: { status: "PENDING", deletedAt: null },
    });
    if (pendingPayroll > 0) {
      items.push({
        id: "alert:principal-payroll",
        type: "ALERT",
        title: `${pendingPayroll} payroll${pendingPayroll === 1 ? "" : "s"} waiting for approval`,
        body: "Approve the payroll prepared by the accountant.",
        link: "/principal/payroll/pending",
        severity: "warning",
        createdAt: now,
      });
    }
    return items;
  }

  if (actor.role === "ADMIN") {
    const pendingStudents = await prismaMain.student.count({
      where: { approvalStatus: "PENDING", deletedAt: null },
    });
    if (pendingStudents > 0) {
      items.push({
        id: "alert:admin-students",
        type: "ALERT",
        title: `${pendingStudents} student${pendingStudents === 1 ? "" : "s"} waiting for approval`,
        body: "Approve the students added by teachers.",
        link: "/admin/students",
        severity: "warning",
        createdAt: now,
      });
    }
    const pendingPayroll = await prismaMain.payroll.count({
      where: { status: "PENDING", deletedAt: null },
    });
    if (pendingPayroll > 0) {
      items.push({
        id: "alert:admin-payroll",
        type: "ALERT",
        title: `${pendingPayroll} payroll${pendingPayroll === 1 ? "" : "s"} waiting for approval`,
        body: "Follow up on the payroll waiting for the principal.",
        link: "/principal/payroll/pending",
        severity: "info",
        createdAt: now,
      });
    }
    return items;
  }

  if (actor.role === "ACCOUNTANT") {
    const openPayrolls = await prismaMain.payroll.count({
      where: {
        status: { in: ["DRAFT", "PENDING", "APPROVED"] },
        deletedAt: null,
      },
    });
    if (openPayrolls > 0) {
      items.push({
        id: "alert:accountant-payroll",
        type: "ALERT",
        title: `${openPayrolls} payroll${openPayrolls === 1 ? "" : "s"} not paid yet`,
        body: "Prepare, submit and mark the payroll as paid.",
        link: "/accountant/payroll/wizard",
        severity: "warning",
        createdAt: now,
      });
    }
    return items;
  }

  return items;
}

export const NotificationService = {
  /** The bell feed: recent notices for me + the alerts my dashboard shows. */
  async getFeed(actor: T_NotificationActor, limit = 10) {
    const [notices, alerts] = await Promise.all([
      noticeItems(actor, limit),
      // A failing alert must never hide the notices.
      alertItems(actor).catch(() => []),
    ]);

    const items = [...notices, ...alerts].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
    );

    return {
      items,
      counts: {
        total: items.length,
        notices: notices.length,
        alerts: alerts.length,
      },
    };
  },
};
