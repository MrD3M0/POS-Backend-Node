import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { listBsDateRange, shiftBsDays, todayBs } from "@/utils/bs-date";
import type { T_DashboardRange } from "./types";

export const RANGE_VALUES: T_DashboardRange[] = [7, 30, 90];

export function parseRange(value?: string | number): T_DashboardRange {
  const parsed = Number(value);
  return (RANGE_VALUES as number[]).includes(parsed)
    ? (parsed as T_DashboardRange)
    : 30;
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function percent(part: number, total: number): number {
  if (!total) return 0;
  return round1((part / total) * 100);
}

export function classLabelOf(
  batch: { name?: string | null } | null | undefined,
  batchTerm: { name?: string | null; termNumber?: number | null } | null | undefined,
): string {
  const batchName = batch?.name ?? "";
  const termName =
    batchTerm?.name ??
    (batchTerm?.termNumber != null ? `Term ${batchTerm.termNumber}` : "");
  return [batchName, termName].filter(Boolean).join(" ");
}

export function timeToMinutes(value: string | null): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return Number.POSITIVE_INFINITY;
  }
  return hours * 60 + minutes;
}

export function currentMinutesInKathmandu(): number {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kathmandu",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
    const minute = Number(
      parts.find((part) => part.type === "minute")?.value ?? 0,
    );
    return hour * 60 + minute;
  } catch {
    return 0;
  }
}

export interface T_AssignmentMeta {
  id: string;
  subjectName: string;
  classLabel: string;
  label: string;
  batchId: string | null;
}

export interface T_DashboardContext {
  teacherId: string;
  range: T_DashboardRange;
  today: string | null;
  assignmentMeta: T_AssignmentMeta[];
  assignmentById: Map<string, T_AssignmentMeta>;
  batchIds: string[];
  /** Validated assignment filter (null = all classes). */
  assignmentId: string | null;
  /** Raw exam batch filter from the client. */
  requestedExamBatchId: string | null;
  currentDates: string[];
  currentStart: string | null;
  currentEnd: string | null;
  previousStart: string | null;
  previousEnd: string | null;
  studentsByBatch: Map<string, number>;
  totalStudents: number;
}

/**
 * Everything the cards share: the teacher (always from the session), the
 * classes they teach, the applied filters and the attendance windows.
 *
 * It is deliberately small — each card loads only what it needs on top of it,
 * so one slow or failing card never blocks the others.
 */
export async function buildContext(
  userId: string | undefined,
  query: {
    assignmentId?: string;
    examBatchId?: string;
    range?: string | number;
  },
): Promise<T_DashboardContext> {
  const teacher = await prismaMain.teacher.findFirst({
    where: {
      deletedAt: null,
      employee: { userId: userId ?? "", deletedAt: null },
    },
    select: { id: true },
  });
  if (!teacher) {
    throw new CustomError(
      "No teacher profile is linked to this account",
      403,
    );
  }
  const teacherId = teacher.id;

  const range = parseRange(query.range);
  const requestedAssignmentId = query.assignmentId ?? null;
  const requestedExamBatchId = query.examBatchId ?? null;
  const today = todayBs();

  const assignments = await prismaMain.teachingAssignment.findMany({
    where: { teacherId, deletedAt: null },
    select: {
      id: true,
      batchTermSubject: {
        select: {
          subject: { select: { id: true, code: true, name: true } },
          batchTerm: {
            select: {
              name: true,
              batch: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const assignmentMeta: T_AssignmentMeta[] = assignments.map((assignment) => {
    const subjectName =
      assignment.batchTermSubject?.subject?.name ??
      assignment.batchTermSubject?.subject?.code ??
      "Unassigned subject";
    const classLabel = classLabelOf(
      assignment.batchTermSubject?.batchTerm?.batch,
      assignment.batchTermSubject?.batchTerm,
    );
    return {
      id: assignment.id,
      subjectName,
      classLabel,
      label: classLabel ? `${subjectName} - ${classLabel}` : subjectName,
      batchId: assignment.batchTermSubject?.batchTerm?.batch?.id ?? null,
    };
  });
  const assignmentById = new Map(
    assignmentMeta.map((item) => [item.id, item]),
  );
  const batchIds = [
    ...new Set(
      assignmentMeta
        .map((item) => item.batchId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  // A client-supplied assignment id must belong to this teacher.
  const assignmentId =
    requestedAssignmentId && assignmentById.has(requestedAssignmentId)
      ? requestedAssignmentId
      : null;

  const studentCounts = batchIds.length
    ? await prismaMain.student.groupBy({
        by: ["batchId"],
        where: { batchId: { in: batchIds }, deletedAt: null },
        _count: { _all: true },
      })
    : [];
  const studentsByBatch = new Map(
    studentCounts.map((row) => [row.batchId, row._count._all]),
  );
  const totalStudents = [...studentsByBatch.values()].reduce(
    (sum, count) => sum + count,
    0,
  );

  const currentDates = today ? listBsDateRange(today, range) : [];
  const currentStart = currentDates[0] ?? null;
  const currentEnd = currentDates[currentDates.length - 1] ?? null;
  const previousAnchor =
    currentStart && today ? shiftBsDays(currentStart, -1) : null;
  const previousDates = previousAnchor
    ? listBsDateRange(previousAnchor, range)
    : [];
  const previousStart = previousDates[0] ?? null;
  const previousEnd = previousDates[previousDates.length - 1] ?? null;

  return {
    teacherId,
    range,
    today,
    assignmentMeta,
    assignmentById,
    batchIds,
    assignmentId,
    requestedExamBatchId,
    currentDates,
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
    studentsByBatch,
    totalStudents,
  };
}
