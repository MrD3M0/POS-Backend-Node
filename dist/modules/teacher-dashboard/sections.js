"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAttendanceSummary = getAttendanceSummary;
exports.getAttendanceTrend = getAttendanceTrend;
exports.getClassAttendance = getClassAttendance;
exports.getTodaySchedule = getTodaySchedule;
exports.getWeekSchedule = getWeekSchedule;
exports.getExamBatches = getExamBatches;
exports.pickExamBatch = pickExamBatch;
exports.getResultDistribution = getResultDistribution;
exports.getPassRate = getPassRate;
exports.getRecentResults = getRecentResults;
exports.getLowAttendance = getLowAttendance;
const prismaClient_1 = require("@/lib/prismaClient");
const service_1 = require("@/modules/holiday/service");
const bs_date_1 = require("@/utils/bs-date");
const context_1 = require("./context");
const LOW_ATTENDANCE_THRESHOLD = 75;
const RESULT_BUCKETS = [
    { label: "0-39", count: 0 },
    { label: "40-59", count: 0 },
    { label: "60-79", count: 0 },
    { label: "80-100", count: 0 },
];
/**
 * Attendance rows of this teacher (optionally one assignment) in a BS date
 * range. Semantics match the former SQL: sessions and attendance rows must be
 * live, the teaching assignment is only filtered by teacher/assignment id.
 * Sessions held on student holidays are excluded so attendance % counts
 * working days only.
 */
function attendanceWhere(ctx, range, assignmentId = ctx.assignmentId, holidayDateBs = []) {
    const dateBs = {};
    if (range?.start && range.end) {
        dateBs.gte = range.start;
        dateBs.lte = range.end;
    }
    if (holidayDateBs.length > 0)
        dateBs.notIn = [...holidayDateBs];
    return {
        deletedAt: null,
        session: {
            deletedAt: null,
            ...(Object.keys(dateBs).length > 0 ? { dateBs } : {}),
            teachingAssignment: {
                teacherId: ctx.teacherId,
                ...(assignmentId ? { id: assignmentId } : {}),
            },
        },
    };
}
async function loadSessionMeta(sessionIds) {
    if (sessionIds.length === 0)
        return new Map();
    const sessions = await prismaClient_1.prismaMain.attendanceSession.findMany({
        where: { id: { in: sessionIds } },
        select: { id: true, dateBs: true, teachingAssignmentId: true },
    });
    return new Map(sessions.map((session) => [session.id, session]));
}
function isPresent(status) {
    return status === "PRESENT" || status === "LATE";
}
/** Attendance % of the selected range and of the range before it. */
async function getAttendanceSummary(ctx) {
    // One holiday lookup covers both ranges; dates outside a sub-range are
    // already constrained by gte/lte there, so extras are harmless.
    const rangeStarts = [ctx.previousStart, ctx.currentStart].filter((date) => Boolean(date));
    const rangeEnds = [ctx.previousEnd, ctx.currentEnd].filter((date) => Boolean(date));
    const holidayDateBs = rangeStarts.length > 0 && rangeEnds.length > 0
        ? [
            ...(await (0, service_1.studentHolidayDateBs)({
                fromBs: [...rangeStarts].sort()[0],
                toBs: [...rangeEnds].sort()[rangeEnds.length - 1],
            })),
        ]
        : [];
    const countRange = async (start, end) => {
        if (!start || !end)
            return { total: 0, present: 0 };
        const groups = await prismaClient_1.prismaMain.studentAttendance.groupBy({
            by: ["status"],
            where: attendanceWhere(ctx, { start, end }, ctx.assignmentId, holidayDateBs),
            _count: { _all: true },
        });
        let total = 0;
        let present = 0;
        for (const group of groups) {
            const count = group._count._all;
            total += count;
            if (isPresent(group.status))
                present += count;
        }
        return { total, present };
    };
    const [current, previous] = await Promise.all([
        countRange(ctx.currentStart, ctx.currentEnd),
        countRange(ctx.previousStart, ctx.previousEnd),
    ]);
    return {
        attendanceRate: (0, context_1.percent)(current.present, current.total),
        previousAttendanceRate: (0, context_1.percent)(previous.present, previous.total),
    };
}
/** Attendance per day of the selected range. */
async function getAttendanceTrend(ctx) {
    const holidayDateBs = ctx.currentStart && ctx.currentEnd
        ? [
            ...(await (0, service_1.studentHolidayDateBs)({
                fromBs: ctx.currentStart,
                toBs: ctx.currentEnd,
            })),
        ]
        : [];
    const groups = ctx.currentStart && ctx.currentEnd
        ? await prismaClient_1.prismaMain.studentAttendance.groupBy({
            by: ["sessionId", "status"],
            where: attendanceWhere(ctx, { start: ctx.currentStart, end: ctx.currentEnd }, ctx.assignmentId, holidayDateBs),
            _count: { _all: true },
        })
        : [];
    const sessionMeta = await loadSessionMeta([...new Set(groups.map((group) => group.sessionId))]);
    const trendByDate = new Map();
    for (const group of groups) {
        const session = sessionMeta.get(group.sessionId);
        if (!session)
            continue;
        const row = trendByDate.get(session.dateBs) ?? {
            present: 0,
            absent: 0,
            late: 0,
            leave: 0,
        };
        const count = group._count._all;
        if (group.status === "PRESENT")
            row.present += count;
        else if (group.status === "ABSENT")
            row.absent += count;
        else if (group.status === "LATE")
            row.late += count;
        else if (group.status === "LEAVE")
            row.leave += count;
        trendByDate.set(session.dateBs, row);
    }
    return ctx.currentDates.map((date) => {
        const row = trendByDate.get(date);
        return {
            date,
            present: row?.present ?? 0,
            absent: row?.absent ?? 0,
            late: row?.late ?? 0,
            leave: row?.leave ?? 0,
        };
    });
}
/** Attendance % per class (my teaching assignments). */
async function getClassAttendance(ctx) {
    // Class attendance spans all time, so the full student holiday set applies.
    const holidayDateBs = [...(await (0, service_1.studentHolidayDateBs)())];
    const groups = await prismaClient_1.prismaMain.studentAttendance.groupBy({
        by: ["sessionId", "status"],
        where: attendanceWhere(ctx, undefined, null, holidayDateBs),
        _count: { _all: true },
    });
    const sessionMeta = await loadSessionMeta([...new Set(groups.map((group) => group.sessionId))]);
    const classRowById = new Map();
    for (const group of groups) {
        const session = sessionMeta.get(group.sessionId);
        if (!session)
            continue;
        const row = classRowById.get(session.teachingAssignmentId) ?? {
            total: 0,
            present: 0,
        };
        const count = group._count._all;
        row.total += count;
        if (isPresent(group.status))
            row.present += count;
        classRowById.set(session.teachingAssignmentId, row);
    }
    return ctx.assignmentMeta.map((assignment) => {
        const row = classRowById.get(assignment.id);
        const total = row?.total ?? 0;
        const present = row?.present ?? 0;
        return {
            assignmentId: assignment.id,
            label: assignment.label,
            subjectName: assignment.subjectName,
            classLabel: assignment.classLabel,
            presentPercent: (0, context_1.percent)(present, total),
            presentCount: present,
            totalRecords: total,
        };
    });
}
const DAY_NAMES = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
];
async function loadScheduleRows(ctx) {
    return prismaClient_1.prismaMain.classSchedule.findMany({
        where: {
            deletedAt: null,
            isActive: true,
            teachingAssignment: {
                teacherId: ctx.teacherId,
                deletedAt: null,
                isActive: true,
            },
        },
        include: {
            teachingAssignment: {
                include: {
                    batchTermSubject: {
                        include: {
                            subject: { select: { id: true, name: true, code: true } },
                            batchTerm: { include: { batch: { select: { id: true, name: true } } } },
                        },
                    },
                },
            },
            period: true,
        },
        orderBy: { period: { periodNumber: "asc" } },
    });
}
function isScheduleEffectiveOn(schedule, dateBs) {
    return schedule.effectiveFromBs <= dateBs && (!schedule.effectiveToBs || schedule.effectiveToBs >= dateBs);
}
function scheduleStatusFor(startTime, endTime, nowMinutes) {
    const start = (0, context_1.timeToMinutes)(startTime);
    const end = (0, context_1.timeToMinutes)(endTime);
    if (nowMinutes >= end)
        return "COMPLETED";
    if (nowMinutes >= start && nowMinutes < end)
        return "ONGOING";
    return "UPCOMING";
}
/**
 * Today's classes from the weekly routine, with holiday and ONGOING/UPCOMING
 * status. A holiday (appliesToEmployees) yields an empty list + holiday name.
 */
async function getTodaySchedule(ctx) {
    if (!ctx.today) {
        return { todaySchedule: [], pendingAttendance: 0, holiday: null, dateBs: null, dayOfWeek: null };
    }
    const today = ctx.today;
    const dayName = DAY_NAMES[(0, bs_date_1.bsWeekday)(today)] ?? null;
    const holiday = await prismaClient_1.prismaMain.holiday.findFirst({
        where: { dateBs: today, deletedAt: null, appliesToEmployees: true },
        select: { name: true },
    });
    if (holiday) {
        return {
            todaySchedule: [],
            pendingAttendance: 0,
            holiday: { name: holiday.name },
            dateBs: today,
            dayOfWeek: dayName,
        };
    }
    const schedules = (await loadScheduleRows(ctx)).filter((schedule) => schedule.dayOfWeek === dayName && isScheduleEffectiveOn(schedule, today));
    // Sessions already taken today, keyed by assignmentId:periodId.
    const sessions = await prismaClient_1.prismaMain.attendanceSession.findMany({
        where: { teacherId: ctx.teacherId, dateBs: today, deletedAt: null },
        select: { id: true, teachingAssignmentId: true, periodId: true },
    });
    const sessionByKey = new Map(sessions.map((session) => [
        `${session.teachingAssignmentId}:${session.periodId}`,
        session.id,
    ]));
    const recordCounts = sessions.length
        ? await prismaClient_1.prismaMain.studentAttendance.groupBy({
            by: ["sessionId"],
            where: { sessionId: { in: sessions.map((session) => session.id) } },
            _count: { _all: true },
        })
        : [];
    const recordCountBySession = new Map(recordCounts.map((row) => [row.sessionId, row._count._all]));
    const nowMinutes = (0, context_1.currentMinutesInKathmandu)();
    const items = schedules.map((schedule) => {
        const subject = schedule.teachingAssignment.batchTermSubject.subject;
        const batchTerm = schedule.teachingAssignment.batchTermSubject.batchTerm;
        const subjectName = subject?.name ?? subject?.code ?? "Unassigned subject";
        const classLabel = (0, context_1.classLabelOf)(batchTerm?.batch, batchTerm);
        const sessionId = sessionByKey.get(`${schedule.teachingAssignmentId}:${schedule.periodId}`) ?? null;
        return {
            scheduleId: schedule.id,
            sessionId,
            assignmentId: schedule.teachingAssignmentId,
            periodId: schedule.periodId,
            label: classLabel ? `${subjectName} - ${classLabel}` : subjectName,
            subjectName,
            subjectCode: subject?.code ?? null,
            classLabel,
            periodName: schedule.period.name ?? `Period ${schedule.period.periodNumber}`,
            startTime: schedule.period.startTime,
            endTime: schedule.period.endTime,
            room: schedule.room,
            attendanceTaken: sessionId ? (recordCountBySession.get(sessionId) ?? 0) > 0 : false,
            status: scheduleStatusFor(schedule.period.startTime, schedule.period.endTime, nowMinutes),
            isNext: false,
        };
    });
    const firstUpcomingIndex = items.findIndex((item) => item.status === "UPCOMING");
    const todaySchedule = items.map((item, index) => ({
        ...item,
        isNext: index === firstUpcomingIndex,
    }));
    return {
        todaySchedule,
        pendingAttendance: todaySchedule.filter((item) => !item.attendanceTaken).length,
        holiday: null,
        dateBs: today,
        dayOfWeek: dayName,
    };
}
/**
 * This week (Sunday–Friday) day by day, from the weekly routine, including
 * holidays. Used by the dashboard "this week" grid.
 */
async function getWeekSchedule(ctx) {
    if (!ctx.today)
        return { days: [] };
    const weekday = (0, bs_date_1.bsWeekday)(ctx.today);
    const sunday = (0, bs_date_1.shiftBsDays)(ctx.today, -weekday);
    if (!sunday)
        return { days: [] };
    const dates = [];
    for (let i = 0; i < 6; i += 1) {
        const date = (0, bs_date_1.shiftBsDays)(sunday, i);
        if (date)
            dates.push(date);
    }
    const schedules = await loadScheduleRows(ctx);
    const holidays = await prismaClient_1.prismaMain.holiday.findMany({
        where: { dateBs: { in: dates }, deletedAt: null, appliesToEmployees: true },
        select: { dateBs: true, name: true },
    });
    const holidayByName = new Map(holidays.map((row) => [row.dateBs, row.name]));
    const sessions = await prismaClient_1.prismaMain.attendanceSession.findMany({
        where: { teacherId: ctx.teacherId, dateBs: { in: dates }, deletedAt: null },
        select: { id: true, teachingAssignmentId: true, periodId: true, dateBs: true },
    });
    const recordCounts = sessions.length
        ? await prismaClient_1.prismaMain.studentAttendance.groupBy({
            by: ["sessionId"],
            where: { sessionId: { in: sessions.map((session) => session.id) } },
            _count: { _all: true },
        })
        : [];
    const recordCountBySession = new Map(recordCounts.map((row) => [row.sessionId, row._count._all]));
    const days = dates.map((date) => {
        const holidayName = holidayByName.get(date) ?? null;
        const dayItems = holidayName
            ? []
            : schedules
                .filter((schedule) => schedule.dayOfWeek === (DAY_NAMES[(0, bs_date_1.bsWeekday)(date)] ?? "") &&
                isScheduleEffectiveOn(schedule, date))
                .map((schedule) => {
                const subject = schedule.teachingAssignment.batchTermSubject.subject;
                const batchTerm = schedule.teachingAssignment.batchTermSubject.batchTerm;
                const subjectName = subject?.name ?? subject?.code ?? "Unassigned subject";
                const classLabel = (0, context_1.classLabelOf)(batchTerm?.batch, batchTerm);
                const sessionId = sessions.find((session) => session.dateBs === date &&
                    session.teachingAssignmentId === schedule.teachingAssignmentId &&
                    session.periodId === schedule.periodId)?.id ?? null;
                return {
                    scheduleId: schedule.id,
                    sessionId,
                    assignmentId: schedule.teachingAssignmentId,
                    periodId: schedule.periodId,
                    label: classLabel ? `${subjectName} - ${classLabel}` : subjectName,
                    subjectName,
                    subjectCode: subject?.code ?? null,
                    classLabel,
                    periodName: schedule.period.name ?? `Period ${schedule.period.periodNumber}`,
                    startTime: schedule.period.startTime,
                    endTime: schedule.period.endTime,
                    room: schedule.room,
                    attendanceTaken: sessionId
                        ? (recordCountBySession.get(sessionId) ?? 0) > 0
                        : false,
                    status: "UPCOMING",
                    isNext: false,
                };
            });
        return {
            date,
            dayOfWeek: DAY_NAMES[(0, bs_date_1.bsWeekday)(date)] ?? "",
            holidayName,
            items: dayItems,
        };
    });
    return { days };
}
/** The exam subjects of my classes + how many marks are still missing. */
async function getExamBatches(ctx) {
    const examSubjects = await prismaClient_1.prismaMain.examSubject.findMany({
        where: {
            deletedAt: null,
            exam: { deletedAt: null },
            batchTermSubject: {
                assignments: { some: { teacherId: ctx.teacherId, deletedAt: null } },
            },
        },
        select: {
            id: true,
            examId: true,
            fullMarks: true,
            passMarks: true,
            examDateBs: true,
            exam: {
                select: { id: true, name: true, startDateBs: true, endDateBs: true },
            },
            batchTermSubject: {
                select: {
                    subject: { select: { id: true, name: true, code: true } },
                    batchTerm: {
                        select: {
                            name: true,
                            batch: { select: { id: true, name: true } },
                        },
                    },
                },
            },
        },
    });
    const examSubjectIds = examSubjects.map((row) => row.id);
    const markCounts = examSubjectIds.length
        ? await prismaClient_1.prismaMain.examMark.groupBy({
            by: ["examSubjectId"],
            where: { examSubjectId: { in: examSubjectIds }, deletedAt: null },
            _count: { _all: true },
        })
        : [];
    const markCountBySubject = new Map(markCounts.map((row) => [row.examSubjectId, row._count._all]));
    const examBatchMeta = examSubjects.map((row) => {
        const subjectName = row.batchTermSubject?.subject?.name ??
            row.batchTermSubject?.subject?.code ??
            "Unassigned subject";
        const classLabel = (0, context_1.classLabelOf)(row.batchTermSubject?.batchTerm?.batch, row.batchTermSubject?.batchTerm);
        const batchId = row.batchTermSubject?.batchTerm?.batch?.id ?? null;
        const totalStudentsForBatch = batchId
            ? (ctx.studentsByBatch.get(batchId) ?? 0)
            : 0;
        const marksEntered = markCountBySubject.get(row.id) ?? 0;
        const marksStatus = totalStudentsForBatch === 0
            ? "PENDING"
            : marksEntered >= totalStudentsForBatch
                ? "COMPLETE"
                : marksEntered > 0
                    ? "PARTIAL"
                    : "PENDING";
        return {
            id: row.id,
            examId: row.examId,
            examName: row.exam?.name ?? "Unnamed exam",
            subjectName,
            classLabel,
            label: `${row.exam?.name ?? "Unnamed exam"} - ${subjectName}`,
            examDateBs: row.examDateBs ?? row.exam?.startDateBs ?? null,
            fullMarks: Number(row.fullMarks),
            passMarks: Number(row.passMarks),
            marksStatus,
            marksEntered,
            totalStudents: totalStudentsForBatch,
        };
    });
    const isUpcoming = (batch) => !batch.examDateBs || !ctx.today || batch.examDateBs >= ctx.today;
    const upcomingExamBatches = examBatchMeta
        .filter((batch) => isUpcoming(batch) || batch.marksStatus !== "COMPLETE")
        .sort((a, b) => {
        if (!a.examDateBs)
            return 1;
        if (!b.examDateBs)
            return -1;
        return a.examDateBs.localeCompare(b.examDateBs);
    })
        .slice(0, 10);
    const pendingMarksEntry = examBatchMeta.filter((batch) => batch.marksStatus !== "COMPLETE" && isUpcoming(batch)).length;
    return { examBatchMeta, upcomingExamBatches, pendingMarksEntry };
}
/** The exam batch the charts are about (the requested one, or the next). */
function pickExamBatch(ctx, examBatchMeta) {
    return (examBatchMeta.find((batch) => batch.id === ctx.requestedExamBatchId) ??
        examBatchMeta[0] ??
        null);
}
/** Marks of one exam batch, grouped into score buckets. */
async function getResultDistribution(ctx, selectedBatch) {
    const distributionMarks = selectedBatch
        ? await prismaClient_1.prismaMain.examMark.findMany({
            where: { examSubjectId: selectedBatch.id, deletedAt: null },
            select: { marksObtained: true, isAbsent: true },
        })
        : [];
    const buckets = RESULT_BUCKETS.map((bucket) => ({ ...bucket }));
    let passed = 0;
    let failed = 0;
    for (const mark of distributionMarks) {
        const obtained = mark.isAbsent ? 0 : Number(mark.marksObtained ?? 0);
        const ratio = selectedBatch && selectedBatch.fullMarks > 0
            ? (obtained / selectedBatch.fullMarks) * 100
            : 0;
        const index = ratio >= 80 ? 3 : ratio >= 60 ? 2 : ratio >= 40 ? 1 : 0;
        buckets[index].count += 1;
        if (selectedBatch &&
            !mark.isAbsent &&
            obtained >= selectedBatch.passMarks) {
            passed += 1;
        }
        else {
            failed += 1;
        }
    }
    return {
        examBatchId: selectedBatch?.id ?? null,
        label: selectedBatch?.label ?? "No exam batch",
        buckets,
        passed,
        failed,
        total: distributionMarks.length,
    };
}
/** Pass rate per subject of the selected exam. */
async function getPassRate(ctx, selectedBatch) {
    const passRateSubjects = selectedBatch
        ? await prismaClient_1.prismaMain.examSubject.findMany({
            where: { examId: selectedBatch.examId, deletedAt: null },
            select: {
                id: true,
                fullMarks: true,
                passMarks: true,
                batchTermSubject: {
                    select: { subject: { select: { name: true, code: true } } },
                },
            },
        })
        : [];
    const passRateMarks = passRateSubjects.length
        ? await prismaClient_1.prismaMain.examMark.findMany({
            where: {
                examSubjectId: { in: passRateSubjects.map((row) => row.id) },
                deletedAt: null,
            },
            select: { examSubjectId: true, marksObtained: true, isAbsent: true },
        })
        : [];
    const marksBySubject = new Map();
    for (const row of passRateSubjects) {
        marksBySubject.set(row.id, { passed: 0, total: 0 });
    }
    for (const mark of passRateMarks) {
        const bucket = marksBySubject.get(mark.examSubjectId);
        const subjectRow = passRateSubjects.find((row) => row.id === mark.examSubjectId);
        if (!bucket || !subjectRow)
            continue;
        bucket.total += 1;
        const obtained = mark.isAbsent ? 0 : Number(mark.marksObtained ?? 0);
        if (!mark.isAbsent && obtained >= Number(subjectRow.passMarks)) {
            bucket.passed += 1;
        }
    }
    const subjects = passRateSubjects.map((row) => {
        const bucket = marksBySubject.get(row.id) ?? { passed: 0, total: 0 };
        return {
            subjectName: row.batchTermSubject?.subject?.name ??
                row.batchTermSubject?.subject?.code ??
                "Unassigned subject",
            passPercent: (0, context_1.percent)(bucket.passed, bucket.total),
            passed: bucket.passed,
            total: bucket.total,
        };
    });
    const overallPassed = subjects.reduce((sum, row) => sum + row.passed, 0);
    const overallTotal = subjects.reduce((sum, row) => sum + row.total, 0);
    return {
        examBatchId: selectedBatch?.id ?? null,
        label: selectedBatch?.examName ?? "No exam selected",
        subjects,
        overallPassPercent: (0, context_1.percent)(overallPassed, overallTotal),
    };
}
/** The last exam subjects with their average / highest / lowest marks. */
async function getRecentResults(ctx, examBatchMeta) {
    const recentBatches = [...examBatchMeta]
        .sort((a, b) => (b.examDateBs ?? "").localeCompare(a.examDateBs ?? ""))
        .slice(0, 6);
    const recentResultSubjects = recentBatches.length
        ? await prismaClient_1.prismaMain.resultSubject.findMany({
            where: {
                deletedAt: null,
                examSubjectId: { in: recentBatches.map((batch) => batch.id) },
            },
            select: {
                examSubjectId: true,
                resultId: true,
                marksObtained: true,
            },
        })
        : [];
    const resultIds = [
        ...new Set(recentResultSubjects.map((row) => row.resultId)),
    ];
    const statusRows = resultIds.length
        ? await prismaClient_1.prismaMain.result.findMany({
            where: { id: { in: resultIds } },
            select: { id: true, status: true },
        })
        : [];
    const statusByResult = new Map(statusRows.map((row) => [row.id, row.status]));
    return recentBatches.map((batch) => {
        const rows = recentResultSubjects.filter((row) => row.examSubjectId === batch.id);
        const marks = rows.map((row) => Number(row.marksObtained ?? 0));
        const average = marks.length
            ? (0, context_1.round1)(marks.reduce((sum, mark) => sum + mark, 0) / marks.length)
            : 0;
        const highest = marks.length ? Math.max(...marks) : 0;
        const lowest = marks.length ? Math.min(...marks) : 0;
        const passedRows = marks.filter((mark) => mark >= batch.passMarks).length;
        const status = rows.length
            ? (statusByResult.get(rows[0].resultId) ?? "DRAFT")
            : "DRAFT";
        return {
            resultId: rows[0]?.resultId ?? null,
            examName: batch.examName,
            subjectName: batch.subjectName,
            classLabel: batch.classLabel,
            average,
            highest,
            lowest,
            passPercent: (0, context_1.percent)(passedRows, marks.length),
            status,
            published: status === "PUBLISHED",
        };
    });
}
/** Students whose attendance in a class is below the threshold. */
async function getLowAttendance(ctx) {
    // Low attendance % spans all time, so the full student holiday set applies.
    const holidayDateBs = [...(await (0, service_1.studentHolidayDateBs)())];
    const groups = await prismaClient_1.prismaMain.studentAttendance.groupBy({
        by: ["studentId", "sessionId", "status"],
        where: attendanceWhere(ctx, undefined, ctx.assignmentId, holidayDateBs),
        _count: { _all: true },
    });
    const sessionMeta = await loadSessionMeta([...new Set(groups.map((group) => group.sessionId))]);
    const pairTotals = new Map();
    for (const group of groups) {
        const session = sessionMeta.get(group.sessionId);
        if (!session)
            continue;
        const key = `${group.studentId}:${session.teachingAssignmentId}`;
        const row = pairTotals.get(key) ?? {
            studentId: group.studentId,
            assignmentId: session.teachingAssignmentId,
            total: 0,
            present: 0,
        };
        const count = group._count._all;
        row.total += count;
        if (isPresent(group.status))
            row.present += count;
        pairTotals.set(key, row);
    }
    const lowAttendancePairs = [...pairTotals.values()]
        .map((row) => ({
        ...row,
        percent: (0, context_1.percent)(row.present, row.total),
    }))
        .filter((row) => row.total > 0 && row.percent < LOW_ATTENDANCE_THRESHOLD)
        .sort((a, b) => a.percent - b.percent)
        .slice(0, 10);
    const lowStudentIds = [
        ...new Set(lowAttendancePairs.map((row) => row.studentId)),
    ];
    const lowStudents = lowStudentIds.length
        ? await prismaClient_1.prismaMain.student.findMany({
            where: { id: { in: lowStudentIds }, deletedAt: null },
            select: {
                id: true,
                universityRegNo: true,
                firstName: true,
                middleName: true,
                lastName: true,
            },
        })
        : [];
    const studentById = new Map(lowStudents.map((student) => [student.id, student]));
    return lowAttendancePairs
        .map((pair) => {
        const student = studentById.get(pair.studentId);
        const meta = ctx.assignmentById.get(pair.assignmentId);
        return {
            studentId: pair.studentId,
            name: student
                ? [student.firstName, student.middleName, student.lastName]
                    .filter(Boolean)
                    .join(" ")
                : "Unknown student",
            universityRegNo: student?.universityRegNo ?? "—",
            classLabel: meta?.classLabel ?? "—",
            subjectName: meta?.subjectName ?? "—",
            attendancePercent: pair.percent,
            presentCount: pair.present,
            totalRecords: pair.total,
        };
    })
        .filter((row) => row.name !== "Unknown student");
}
