"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherDashboardService = void 0;
const context_1 = require("./context");
const sections_1 = require("./sections");
/**
 * The teacher dashboard.
 *
 * Every card has its own section function and its own endpoint, so a card that
 * fails (or is slow) never blocks the other cards — the frontend asks for
 * each card separately. `getDashboard` simply composes all of them and stays
 * for the combined payload.
 */
exports.TeacherDashboardService = {
    async getContext(userId, query) {
        return (0, context_1.buildContext)(userId, query);
    },
    // ── One card per call ─────────────────────────────────────────────────
    async getStats(ctx) {
        const [summary, schedule, exams] = await Promise.all([
            (0, sections_1.getAttendanceSummary)(ctx),
            (0, sections_1.getTodaySchedule)(ctx),
            (0, sections_1.getExamBatches)(ctx),
        ]);
        return {
            totalClasses: {
                value: ctx.assignmentMeta.length,
                helper: ctx.assignmentMeta.length === 1
                    ? "1 class this semester"
                    : `${ctx.assignmentMeta.length} classes this semester`,
            },
            totalStudents: {
                value: ctx.totalStudents,
                helper: `across ${ctx.batchIds.length} batch${ctx.batchIds.length === 1 ? "" : "es"}`,
            },
            pendingAttendance: {
                value: schedule.pendingAttendance,
                helper: schedule.pendingAttendance === 0
                    ? "all sessions taken today"
                    : `${schedule.pendingAttendance} session${schedule.pendingAttendance === 1 ? "" : "s"} left today`,
            },
            pendingMarksEntry: {
                value: exams.pendingMarksEntry,
                helper: exams.pendingMarksEntry === 0
                    ? "marks are up to date"
                    : `${exams.pendingMarksEntry} exam${exams.pendingMarksEntry === 1 ? " needs" : "s need"} marks`,
            },
            attendanceRate: summary.attendanceRate,
            previousAttendanceRate: summary.previousAttendanceRate,
        };
    },
    getAttendanceTrend: sections_1.getAttendanceTrend,
    getClassAttendance: sections_1.getClassAttendance,
    getTodaySchedule: sections_1.getTodaySchedule,
    getWeekSchedule: sections_1.getWeekSchedule,
    async getExamBatchesCard(ctx) {
        const exams = await (0, sections_1.getExamBatches)(ctx);
        return {
            upcomingExamBatches: exams.upcomingExamBatches,
            pendingMarksEntry: exams.pendingMarksEntry,
        };
    },
    async getExamBatchOptions(ctx) {
        const exams = await (0, sections_1.getExamBatches)(ctx);
        return exams.examBatchMeta.map((item) => ({ id: item.id, label: item.label }));
    },
    async getResultDistributionCard(ctx) {
        const exams = await (0, sections_1.getExamBatches)(ctx);
        const selectedBatch = (0, sections_1.pickExamBatch)(ctx, exams.examBatchMeta);
        return (0, sections_1.getResultDistribution)(ctx, selectedBatch);
    },
    async getPassRateCard(ctx) {
        const exams = await (0, sections_1.getExamBatches)(ctx);
        const selectedBatch = (0, sections_1.pickExamBatch)(ctx, exams.examBatchMeta);
        return (0, sections_1.getPassRate)(ctx, selectedBatch);
    },
    async getRecentResultsCard(ctx) {
        const exams = await (0, sections_1.getExamBatches)(ctx);
        return (0, sections_1.getRecentResults)(ctx, exams.examBatchMeta);
    },
    getLowAttendance: sections_1.getLowAttendance,
    /** Options for the class / exam-batch selectors. */
    async getFilterOptions(ctx) {
        const exams = await (0, sections_1.getExamBatches)(ctx);
        return {
            assignments: ctx.assignmentMeta.map((item) => ({
                id: item.id,
                label: item.label,
            })),
            examBatches: exams.examBatchMeta.map((item) => ({
                id: item.id,
                label: item.label,
            })),
        };
    },
    /** Everything at once (kept for the combined payload). */
    async getDashboard(userId, query) {
        const ctx = await (0, context_1.buildContext)(userId, query);
        const [stats, attendanceTrend, classAttendance, schedule, exams] = await Promise.all([
            this.getStats(ctx),
            (0, sections_1.getAttendanceTrend)(ctx),
            (0, sections_1.getClassAttendance)(ctx),
            (0, sections_1.getTodaySchedule)(ctx),
            (0, sections_1.getExamBatches)(ctx),
        ]);
        const selectedBatch = (0, sections_1.pickExamBatch)(ctx, exams.examBatchMeta);
        const [resultDistribution, passRateBySubject, recentResults, lowAttendance] = await Promise.all([
            (0, sections_1.getResultDistribution)(ctx, selectedBatch),
            (0, sections_1.getPassRate)(ctx, selectedBatch),
            (0, sections_1.getRecentResults)(ctx, exams.examBatchMeta),
            (0, sections_1.getLowAttendance)(ctx),
        ]);
        return {
            stats,
            attendanceTrend,
            classAttendance,
            resultDistribution,
            passRateBySubject,
            todaySchedule: schedule.todaySchedule,
            lowAttendanceStudents: lowAttendance,
            upcomingExamBatches: exams.upcomingExamBatches,
            recentResults,
            filters: {
                assignments: ctx.assignmentMeta.map((item) => ({
                    id: item.id,
                    label: item.label,
                })),
                examBatches: exams.examBatchMeta.map((item) => ({
                    id: item.id,
                    label: item.label,
                })),
            },
            applied: {
                assignmentId: ctx.assignmentId,
                examBatchId: selectedBatch?.id ?? null,
                range: ctx.range,
                todayBs: ctx.today,
            },
        };
    },
};
