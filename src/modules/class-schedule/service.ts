import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import { bsWeekday, listBsDateRangeBetween } from "@/utils/bs-date";
import type { Prisma } from "@/generated/prisma/client";
import type { ClassScheduleCreateInput, ClassScheduleUpdateInput } from "./validator";

const CLASS_SCHEDULE_INCLUDE = {
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
  period: true,
} as const;

export type ClassScheduleRow = Prisma.ClassScheduleGetPayload<{
  include: typeof CLASS_SCHEDULE_INCLUDE;
}>;

// ── Calendar event shape (shared with /class-schedule/calendar + week endpoints) ──

export interface T_CalendarClassEvent {
  id: string;
  dateBs: string;
  dayOfWeek: string;
  periodId: string;
  periodName: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  room: string | null;
  teachingAssignmentId: string;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  batchTermId: string;
  batchTermName: string;
  batchId: string;
  batchName: string;
  classLabel: string;
  isElective: boolean;
}

export interface T_ClassScheduleCalendarResponse {
  events: T_CalendarClassEvent[];
  holidays: { dateBs: string; name: string }[];
}

export const ClassScheduleService = {
  async index(query: {
    page?: number;
    limit?: number;
    search?: string;
    batchId?: string;
    batchTermId?: string;
    teacherId?: string;
    dayOfWeek?: string;
    periodId?: string;
    isActive?: boolean;
  }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: any = { deletedAt: null };

    if (query.batchId || query.batchTermId || query.teacherId) {
      whereClause.teachingAssignment = {};
      if (query.teacherId) {
        whereClause.teachingAssignment.teacherId = query.teacherId;
      }
      if (query.batchTermId || query.batchId) {
        whereClause.teachingAssignment.batchTermSubject = {};
        if (query.batchTermId) {
          whereClause.teachingAssignment.batchTermSubject.batchTermId = query.batchTermId;
        }
        if (query.batchId) {
          whereClause.teachingAssignment.batchTermSubject.batchTerm = { batchId: query.batchId };
        }
      }
    }
    if (query.dayOfWeek) {
      whereClause.dayOfWeek = query.dayOfWeek;
    }
    if (query.periodId) {
      whereClause.periodId = query.periodId;
    }
    if (query.isActive !== undefined) {
      whereClause.isActive = query.isActive;
    }
    if (query.search) {
      whereClause.OR = [
        { room: { contains: query.search, mode: "insensitive" } },
        {
          teachingAssignment: {
            batchTermSubject: {
              subject: {
                OR: [
                  { name: { contains: query.search, mode: "insensitive" } },
                  { code: { contains: query.search, mode: "insensitive" } },
                ],
              },
            },
          },
        },
        {
          teachingAssignment: {
            teacher: {
              employee: {
                OR: [
                  { firstName: { contains: query.search, mode: "insensitive" } },
                  { lastName: { contains: query.search, mode: "insensitive" } },
                ],
              },
            },
          },
        },
      ];
    }

    const [classSchedules, total] = await Promise.all([
      prismaMain.classSchedule.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: CLASS_SCHEDULE_INCLUDE,
        orderBy: [
          { dayOfWeek: "asc" },
          { period: { periodNumber: "asc" } },
          { effectiveFromBs: "asc" },
        ],
      }),
      prismaMain.classSchedule.count({ where: whereClause }),
    ]);

    return {
      data: classSchedules,
      pagination: { page, limit, total },
    };
  },

  async getById(id: string) {
    const classSchedule = await prismaMain.classSchedule.findFirst({
      where: { id, deletedAt: null },
      include: CLASS_SCHEDULE_INCLUDE,
    });
    if (!classSchedule) {
      throw new CustomError("ClassSchedule not found", 404);
    }
    return classSchedule;
  },

  async create(data: ClassScheduleCreateInput, userId?: string) {
    // Validate assignment exists, is active, not soft-deleted
    const assignment = await prismaMain.teachingAssignment.findFirst({
      where: { id: data.teachingAssignmentId, deletedAt: null },
      include: {
        batchTermSubject: {
          include: {
            subject: true,
            batchTerm: { include: { batch: true } },
          },
        },
        teacher: { include: { employee: true } },
      },
    });
    if (!assignment) {
      throw new CustomError("TeachingAssignment not found or has been deleted", 404);
    }
    if (!assignment.isActive) {
      throw new CustomError("TeachingAssignment is inactive", 400);
    }

    // Validate period exists, is active, not soft-deleted
    const period = await prismaMain.period.findFirst({
      where: { id: data.periodId, deletedAt: null },
    });
    if (!period) {
      throw new CustomError("Period not found or has been deleted", 404);
    }
    if (!period.isActive) {
      throw new CustomError("Period is inactive", 400);
    }

    // Effective range must be within assignment date range
    if (data.effectiveFromBs < assignment.assignedDateBs) {
      throw new CustomError(
        `effectiveFromBs cannot be before the assignment's assignedDateBs (${assignment.assignedDateBs})`,
        400,
      );
    }
    if (assignment.endDateBs && data.effectiveToBs && data.effectiveToBs > assignment.endDateBs) {
      throw new CustomError(
        `effectiveToBs cannot be after the assignment's endDateBs (${assignment.endDateBs})`,
        400,
      );
    }

    await assertNoConflicts(
      {
        teachingAssignmentId: data.teachingAssignmentId,
        periodId: data.periodId,
        dayOfWeek: data.dayOfWeek,
        effectiveFromBs: data.effectiveFromBs,
        effectiveToBs: data.effectiveToBs ?? null,
        room: data.room ?? null,
      },
      null,
    );

    try {
      return await prismaMain.classSchedule.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: CLASS_SCHEDULE_INCLUDE,
      });
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError(
          "A schedule already exists for this assignment, period, day and effective date",
          409,
        );
      }
      throw error;
    }
  },

  async update(id: string, data: ClassScheduleUpdateInput, userId?: string) {
    const existing = await prismaMain.classSchedule.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new CustomError("ClassSchedule not found", 404);
    }

    const merged = {
      teachingAssignmentId: data.teachingAssignmentId ?? existing.teachingAssignmentId,
      periodId: data.periodId ?? existing.periodId,
      dayOfWeek: data.dayOfWeek ?? existing.dayOfWeek,
      effectiveFromBs: data.effectiveFromBs ?? existing.effectiveFromBs,
      effectiveToBs: data.effectiveToBs !== undefined ? data.effectiveToBs : existing.effectiveToBs,
      room: data.room !== undefined ? data.room : existing.room,
      isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
    };

    // Validate assignment if changed
    const assignment = await prismaMain.teachingAssignment.findFirst({
      where: { id: merged.teachingAssignmentId, deletedAt: null },
    });
    if (!assignment) {
      throw new CustomError("TeachingAssignment not found or has been deleted", 404);
    }
    if (!assignment.isActive) {
      throw new CustomError("TeachingAssignment is inactive", 400);
    }
    if (merged.effectiveFromBs < assignment.assignedDateBs) {
      throw new CustomError(
        `effectiveFromBs cannot be before the assignment's assignedDateBs (${assignment.assignedDateBs})`,
        400,
      );
    }
    if (assignment.endDateBs && merged.effectiveToBs && merged.effectiveToBs > assignment.endDateBs) {
      throw new CustomError(
        `effectiveToBs cannot be after the assignment's endDateBs (${assignment.endDateBs})`,
        400,
      );
    }

    const period = await prismaMain.period.findFirst({
      where: { id: merged.periodId, deletedAt: null },
    });
    if (!period) {
      throw new CustomError("Period not found or has been deleted", 404);
    }
    if (!period.isActive) {
      throw new CustomError("Period is inactive", 400);
    }

    await assertNoConflicts(
      {
        teachingAssignmentId: merged.teachingAssignmentId,
        periodId: merged.periodId,
        dayOfWeek: merged.dayOfWeek,
        effectiveFromBs: merged.effectiveFromBs,
        effectiveToBs: merged.effectiveToBs ?? null,
        room: merged.room ?? null,
      },
      id,
    );

    try {
      return await prismaMain.classSchedule.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        },
        include: CLASS_SCHEDULE_INCLUDE,
      });
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError(
          "A schedule already exists for this assignment, period, day and effective date",
          409,
        );
      }
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.classSchedule.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new CustomError("ClassSchedule not found", 404);
    }
    await prismaMain.classSchedule.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
    return null;
  },

  // ── Expanded weekly routines ────────────────────────────────────────────

  /** Teacher weekly routine: rows expanded to BS dates for a date range. */
  async teacherWeek(teacherId: string, fromBs: string, toBs: string) {
    const dates = listBsDateRangeBetween(fromBs, toBs);
    const schedules = await findActiveSchedules({ teacherId });
    return expandSchedulesForDates(schedules, dates);
  },

  /** Batch-term weekly routine (class view). */
  async batchTermWeek(batchTermId: string, fromBs: string, toBs: string) {
    const dates = listBsDateRangeBetween(fromBs, toBs);
    const schedules = await findActiveSchedules({ batchTermId });
    return expandSchedulesForDates(schedules, dates);
  },

  /**
   * Calendar endpoint: weekly routine expanded to BS dates for the range,
   * skipping holidays that apply to employees. Used by teacher dashboard,
   * calendar page and admin schedule view.
   */
  async calendar(fromBs: string, toBs: string, teacherId: string | null) {
    const dates = listBsDateRangeBetween(fromBs, toBs);
    const schedules = await findActiveSchedules(teacherId ? { teacherId } : {});
    const holidays = await prismaMain.holiday.findMany({
      where: {
        deletedAt: null,
        appliesToEmployees: true,
        dateBs: { in: dates },
      },
      select: { dateBs: true, name: true },
    });
    const holidayDates = new Set(holidays.map((h) => h.dateBs));

    const events: T_CalendarClassEvent[] = [];
    for (const schedule of schedules) {
      const dayIndex = dayOfWeekIndex(schedule.dayOfWeek);
      for (const date of dates) {
        if (bsWeekday(date) !== dayIndex) continue;
        if (holidayDates.has(date)) continue;
        if (schedule.effectiveFromBs > date) continue;
        if (schedule.effectiveToBs && schedule.effectiveToBs < date) continue;
        events.push({
          id: schedule.id,
          dateBs: date,
          dayOfWeek: schedule.dayOfWeek,
          periodId: schedule.periodId,
          periodName: schedule.period.name,
          periodNumber: schedule.period.periodNumber,
          startTime: schedule.period.startTime,
          endTime: schedule.period.endTime,
          room: schedule.room,
          teachingAssignmentId: schedule.teachingAssignment.id,
          teacherId: schedule.teachingAssignment.teacherId,
          teacherName: teacherLabel(schedule.teachingAssignment.teacher.employee),
          subjectId: schedule.teachingAssignment.batchTermSubject.subject.id,
          subjectName: schedule.teachingAssignment.batchTermSubject.subject.name,
          subjectCode: schedule.teachingAssignment.batchTermSubject.subject.code,
          batchTermId: schedule.teachingAssignment.batchTermSubject.batchTerm.id,
          batchTermName: schedule.teachingAssignment.batchTermSubject.batchTerm.name,
          batchId: schedule.teachingAssignment.batchTermSubject.batchTerm.batch.id,
          batchName: schedule.teachingAssignment.batchTermSubject.batchTerm.batch.name,
          classLabel: classLabelOf(
            schedule.teachingAssignment.batchTermSubject.batchTerm.batch,
            schedule.teachingAssignment.batchTermSubject.batchTerm,
          ),
          isElective: schedule.teachingAssignment.batchTermSubject.isElective,
        });
      }
    }
    events.sort((a, b) =>
      a.dateBs === b.dateBs
        ? a.periodNumber - b.periodNumber
        : a.dateBs.localeCompare(b.dateBs),
    );
    return { events, holidays };
  },
};

// ── Conflict helpers ────────────────────────────────────────────────────────

type ConflictInput = {
  teachingAssignmentId: string;
  periodId: string;
  dayOfWeek: string;
  effectiveFromBs: string;
  effectiveToBs: string | null;
  room: string | null;
};

/**
 * Overlapping BS date ranges (inclusive). A null effectiveToBs is open-ended.
 */
function rangesOverlap(aFrom: string, aTo: string | null, bFrom: string, bTo: string | null): boolean {
  return aFrom <= (bTo ?? "9999-99-99") && bFrom <= (aTo ?? "9999-99-99");
}

async function assertNoConflicts(data: ConflictInput, excludeId: string | null) {
  const teacherId = await teacherOf(data.teachingAssignmentId);

  // 1. Teacher conflict: same teacher, same dayOfWeek + period, overlapping range.
  const teacherConflict = await prismaMain.classSchedule.findFirst({
    where: {
      deletedAt: null,
      id: excludeId ? { not: excludeId } : undefined,
      dayOfWeek: data.dayOfWeek as any,
      periodId: data.periodId,
      teachingAssignment: { teacherId: teacherId ?? "" },
      OR: [
        { effectiveToBs: null, effectiveFromBs: { lte: data.effectiveToBs ?? "9999-99-99" } },
        { effectiveToBs: { gte: data.effectiveFromBs } },
      ],
    },
    include: {
      teachingAssignment: {
        include: {
          teacher: { include: { employee: true } },
          batchTermSubject: { include: { subject: true, batchTerm: { include: { batch: true } } } },
        },
      },
      period: true,
    },
  });
  if (
    teacherConflict &&
    rangesOverlap(
      data.effectiveFromBs,
      data.effectiveToBs,
      teacherConflict.effectiveFromBs,
      teacherConflict.effectiveToBs,
    )
  ) {
    throw new CustomError(
      `Teacher conflict: ${teacherLabel(teacherConflict.teachingAssignment.teacher.employee)} already has ${teacherConflict.period.name} on ${teacherConflict.dayOfWeek} from ${teacherConflict.effectiveFromBs}${teacherConflict.effectiveToBs ? ` to ${teacherConflict.effectiveToBs}` : ""}`,
      409,
    );
  }

  // 2. Class conflict: same batchTerm, same dayOfWeek + period (unless elective).
  const batchTerm = await batchTermOf(data.teachingAssignmentId);
  if (batchTerm) {
    const classConflict = await prismaMain.classSchedule.findFirst({
      where: {
        deletedAt: null,
        id: excludeId ? { not: excludeId } : undefined,
        dayOfWeek: data.dayOfWeek as any,
        periodId: data.periodId,
        teachingAssignment: {
          batchTermSubject: { batchTermId: batchTerm.id },
        },
        OR: [
          { effectiveToBs: null, effectiveFromBs: { lte: data.effectiveToBs ?? "9999-99-99" } },
          { effectiveToBs: { gte: data.effectiveFromBs } },
        ],
      },
      include: {
        teachingAssignment: {
          include: {
            teacher: { include: { employee: true } },
            batchTermSubject: { include: { subject: true, batchTerm: { include: { batch: true } } } },
          },
        },
        period: true,
      },
    });
    // Elective subjects may share the slot (students opt in, so no collision).
    if (
      classConflict &&
      !classConflict.teachingAssignment.batchTermSubject.isElective &&
      rangesOverlap(
        data.effectiveFromBs,
        data.effectiveToBs,
        classConflict.effectiveFromBs,
        classConflict.effectiveToBs,
      )
    ) {
      throw new CustomError(
        `Class conflict: ${classConflict.teachingAssignment.batchTermSubject.batchTerm.name} of ${classConflict.teachingAssignment.batchTermSubject.batchTerm.batch.name} already has ${classConflict.period.name} on ${classConflict.dayOfWeek} (${classConflict.teachingAssignment.batchTermSubject.subject.name})`,
        409,
      );
    }
  }

  // 3. Room conflict: same room, same dayOfWeek + period, overlapping range.
  if (data.room) {
    const roomConflict = await prismaMain.classSchedule.findFirst({
      where: {
        deletedAt: null,
        id: excludeId ? { not: excludeId } : undefined,
        dayOfWeek: data.dayOfWeek as any,
        periodId: data.periodId,
        room: data.room,
        OR: [
          { effectiveToBs: null, effectiveFromBs: { lte: data.effectiveToBs ?? "9999-99-99" } },
          { effectiveToBs: { gte: data.effectiveFromBs } },
        ],
      },
      include: {
        teachingAssignment: {
          include: {
            teacher: { include: { employee: true } },
            batchTermSubject: { include: { subject: true, batchTerm: { include: { batch: true } } } },
          },
        },
        period: true,
      },
    });
    if (
      roomConflict &&
      rangesOverlap(
        data.effectiveFromBs,
        data.effectiveToBs,
        roomConflict.effectiveFromBs,
        roomConflict.effectiveToBs,
      )
    ) {
      throw new CustomError(
        `Room conflict: room ${data.room} is already booked for ${roomConflict.period.name} on ${roomConflict.dayOfWeek} (${roomConflict.teachingAssignment.batchTermSubject.subject.name})`,
        409,
      );
    }
  }
}

async function teacherOf(assignmentId: string): Promise<string | null> {
  const row = await prismaMain.teachingAssignment.findFirst({
    where: { id: assignmentId, deletedAt: null },
    select: { teacherId: true },
  });
  return row?.teacherId ?? null;
}

async function batchTermOf(assignmentId: string) {
  const row = await prismaMain.teachingAssignment.findFirst({
    where: { id: assignmentId, deletedAt: null },
    select: { batchTermSubject: { select: { batchTermId: true } } },
  });
  if (!row) return null;
  const term = await prismaMain.batchTerm.findFirst({
    where: { id: row.batchTermSubject.batchTermId, deletedAt: null },
  });
  return term;
}

// ── Internal helpers ────────────────────────────────────────────────────────

function teacherLabel(employee: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  employeeCode?: string | null;
} | null) {
  if (!employee) return "Unknown teacher";
  return [employee.firstName, employee.middleName, employee.lastName]
    .filter(Boolean)
    .join(" ");
}

function dayOfWeekIndex(dayOfWeek: string): number {
  return ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"].indexOf(dayOfWeek);
}

async function findActiveSchedules(filter: { teacherId?: string; batchTermId?: string }) {
  return prismaMain.classSchedule.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      ...(filter.teacherId ? { teachingAssignment: { teacherId: filter.teacherId } } : {}),
      ...(filter.batchTermId ? { teachingAssignment: { batchTermSubject: { batchTermId: filter.batchTermId } } } : {}),
    },
    include: {
      teachingAssignment: {
        include: {
          teacher: { include: { employee: true } },
          batchTermSubject: {
            include: {
              subject: true,
              batchTerm: { include: { batch: true } },
            },
          },
        },
      },
      period: true,
    },
  });
}

function classLabelOf(
  batch: { name?: string | null } | null | undefined,
  batchTerm: { name?: string | null; termNumber?: number | null } | null | undefined,
): string {
  const batchName = batch?.name ?? "";
  const termName =
    batchTerm?.name ??
    (batchTerm?.termNumber != null ? `Term ${batchTerm.termNumber}` : "");
  return [batchName, termName].filter(Boolean).join(" ");
}

/**
 * Expand a weekly routine to concrete BS dates. Each schedule row repeats on
 * its dayOfWeek within the effective range; the result is a flat list of
 * concrete class events.
 */
function expandSchedulesForDates(schedules: ClassScheduleRow[], dates: string[]) {
  type Expanded = {
    id: string;
    dateBs: string;
    dayOfWeek: string;
    periodName: string;
    periodNumber: number;
    startTime: string;
    endTime: string;
    room: string | null;
    teacherName: string;
    subjectName: string;
    subjectCode: string;
    classLabel: string;
    isElective: boolean;
  };
  const result: Expanded[] = [];
  for (const schedule of schedules) {
    const dayIndex = dayOfWeekIndex(schedule.dayOfWeek);
    for (const date of dates) {
      if (bsWeekday(date) !== dayIndex) continue;
      if (date < schedule.effectiveFromBs) continue;
      if (schedule.effectiveToBs && schedule.effectiveToBs < date) continue;
      result.push({
        id: schedule.id,
        dateBs: date,
        dayOfWeek: schedule.dayOfWeek,
        periodName: schedule.period.name,
        periodNumber: schedule.period.periodNumber,
        startTime: schedule.period.startTime,
        endTime: schedule.period.endTime,
        room: schedule.room,
        teacherName: teacherLabel(schedule.teachingAssignment.teacher.employee),
        subjectName: schedule.teachingAssignment.batchTermSubject.subject.name,
        subjectCode: schedule.teachingAssignment.batchTermSubject.subject.code,
        classLabel: classLabelOf(
          schedule.teachingAssignment.batchTermSubject.batchTerm.batch,
          schedule.teachingAssignment.batchTermSubject.batchTerm,
        ),
        isElective: schedule.teachingAssignment.batchTermSubject.isElective,
      });
    }
  }
  result.sort((a, b) =>
    a.dateBs === b.dateBs
      ? a.periodNumber - b.periodNumber
      : a.dateBs.localeCompare(b.dateBs),
  );
  return result;
}