"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RANGE_VALUES = void 0;
exports.parseRange = parseRange;
exports.round1 = round1;
exports.percent = percent;
exports.classLabelOf = classLabelOf;
exports.timeToMinutes = timeToMinutes;
exports.currentMinutesInKathmandu = currentMinutesInKathmandu;
exports.buildContext = buildContext;
const prismaClient_1 = require("@/lib/prismaClient");
const CustomError_1 = require("@/errors/CustomError");
const bs_date_1 = require("@/utils/bs-date");
exports.RANGE_VALUES = [7, 30, 90];
function parseRange(value) {
    const parsed = Number(value);
    return exports.RANGE_VALUES.includes(parsed)
        ? parsed
        : 30;
}
function round1(value) {
    return Math.round(value * 10) / 10;
}
function percent(part, total) {
    if (!total)
        return 0;
    return round1((part / total) * 100);
}
function classLabelOf(batch, batchTerm) {
    const batchName = batch?.name ?? "";
    const termName = batchTerm?.name ??
        (batchTerm?.termNumber != null ? `Term ${batchTerm.termNumber}` : "");
    return [batchName, termName].filter(Boolean).join(" ");
}
function timeToMinutes(value) {
    if (!value)
        return Number.POSITIVE_INFINITY;
    const [hours, minutes] = value.split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
        return Number.POSITIVE_INFINITY;
    }
    return hours * 60 + minutes;
}
function currentMinutesInKathmandu() {
    try {
        const parts = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Kathmandu",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).formatToParts(new Date());
        const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
        const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
        return hour * 60 + minute;
    }
    catch {
        return 0;
    }
}
/**
 * Everything the cards share: the teacher (always from the session), the
 * classes they teach, the applied filters and the attendance windows.
 *
 * It is deliberately small — each card loads only what it needs on top of it,
 * so one slow or failing card never blocks the others.
 */
async function buildContext(userId, query) {
    const teacher = await prismaClient_1.prismaMain.teacher.findFirst({
        where: {
            deletedAt: null,
            employee: { userId: userId ?? "", deletedAt: null },
        },
        select: { id: true },
    });
    if (!teacher) {
        throw new CustomError_1.CustomError("No teacher profile is linked to this account", 403);
    }
    const teacherId = teacher.id;
    const range = parseRange(query.range);
    const requestedAssignmentId = query.assignmentId ?? null;
    const requestedExamBatchId = query.examBatchId ?? null;
    const today = (0, bs_date_1.todayBs)();
    const assignments = await prismaClient_1.prismaMain.teachingAssignment.findMany({
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
    const assignmentMeta = assignments.map((assignment) => {
        const subjectName = assignment.batchTermSubject?.subject?.name ??
            assignment.batchTermSubject?.subject?.code ??
            "Unassigned subject";
        const classLabel = classLabelOf(assignment.batchTermSubject?.batchTerm?.batch, assignment.batchTermSubject?.batchTerm);
        return {
            id: assignment.id,
            subjectName,
            classLabel,
            label: classLabel ? `${subjectName} - ${classLabel}` : subjectName,
            batchId: assignment.batchTermSubject?.batchTerm?.batch?.id ?? null,
        };
    });
    const assignmentById = new Map(assignmentMeta.map((item) => [item.id, item]));
    const batchIds = [
        ...new Set(assignmentMeta
            .map((item) => item.batchId)
            .filter((id) => Boolean(id))),
    ];
    // A client-supplied assignment id must belong to this teacher.
    const assignmentId = requestedAssignmentId && assignmentById.has(requestedAssignmentId)
        ? requestedAssignmentId
        : null;
    const studentCounts = batchIds.length
        ? await prismaClient_1.prismaMain.student.groupBy({
            by: ["batchId"],
            where: { batchId: { in: batchIds }, deletedAt: null },
            _count: { _all: true },
        })
        : [];
    const studentsByBatch = new Map(studentCounts.map((row) => [row.batchId, row._count._all]));
    const totalStudents = [...studentsByBatch.values()].reduce((sum, count) => sum + count, 0);
    const currentDates = today ? (0, bs_date_1.listBsDateRange)(today, range) : [];
    const currentStart = currentDates[0] ?? null;
    const currentEnd = currentDates[currentDates.length - 1] ?? null;
    const previousAnchor = currentStart && today ? (0, bs_date_1.shiftBsDays)(currentStart, -1) : null;
    const previousDates = previousAnchor
        ? (0, bs_date_1.listBsDateRange)(previousAnchor, range)
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
