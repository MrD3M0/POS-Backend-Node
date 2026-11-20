import { buildContext, type T_DashboardContext } from "./context";
import {
  getAttendanceSummary,
  getAttendanceTrend,
  getClassAttendance,
  getExamBatches,
  getLowAttendance,
  getPassRate,
  getRecentResults,
  getResultDistribution,
  getTodaySchedule,
  getWeekSchedule,
  pickExamBatch,
} from "./sections";
import type {
  T_DashboardRange,
  T_DashboardStats,
  T_TeacherDashboardResponse,
} from "./types";

export type T_DashboardQuery = {
  assignmentId?: string;
  examBatchId?: string;
  range?: string | number;
};

/**
 * The teacher dashboard.
 *
 * Every card has its own section function and its own endpoint, so a card that
 * fails (or is slow) never blocks the other cards — the frontend asks for
 * each card separately. `getDashboard` simply composes all of them and stays
 * for the combined payload.
 */
export const TeacherDashboardService = {
  async getContext(
    userId: string | undefined,
    query: T_DashboardQuery,
  ): Promise<T_DashboardContext> {
    return buildContext(userId, query);
  },

  // ── One card per call ─────────────────────────────────────────────────
  async getStats(
    ctx: T_DashboardContext,
  ): Promise<T_DashboardStats> {
    const [summary, schedule, exams] = await Promise.all([
      getAttendanceSummary(ctx),
      getTodaySchedule(ctx),
      getExamBatches(ctx),
    ]);

    return {
      totalClasses: {
        value: ctx.assignmentMeta.length,
        helper:
          ctx.assignmentMeta.length === 1
            ? "1 class this semester"
            : `${ctx.assignmentMeta.length} classes this semester`,
      },
      totalStudents: {
        value: ctx.totalStudents,
        helper: `across ${ctx.batchIds.length} batch${ctx.batchIds.length === 1 ? "" : "es"}`,
      },
      pendingAttendance: {
        value: schedule.pendingAttendance,
        helper:
          schedule.pendingAttendance === 0
            ? "all sessions taken today"
            : `${schedule.pendingAttendance} session${schedule.pendingAttendance === 1 ? "" : "s"} left today`,
      },
      pendingMarksEntry: {
        value: exams.pendingMarksEntry,
        helper:
          exams.pendingMarksEntry === 0
            ? "marks are up to date"
            : `${exams.pendingMarksEntry} exam${exams.pendingMarksEntry === 1 ? " needs" : "s need"} marks`,
      },
      attendanceRate: summary.attendanceRate,
      previousAttendanceRate: summary.previousAttendanceRate,
    };
  },

  getAttendanceTrend,
  getClassAttendance,
  getTodaySchedule,
  getWeekSchedule,

  async getExamBatchesCard(ctx: T_DashboardContext) {
    const exams = await getExamBatches(ctx);
    return {
      upcomingExamBatches: exams.upcomingExamBatches,
      pendingMarksEntry: exams.pendingMarksEntry,
    };
  },

  async getExamBatchOptions(ctx: T_DashboardContext) {
    const exams = await getExamBatches(ctx);
    return exams.examBatchMeta.map((item) => ({ id: item.id, label: item.label }));
  },

  async getResultDistributionCard(ctx: T_DashboardContext) {
    const exams = await getExamBatches(ctx);
    const selectedBatch = pickExamBatch(ctx, exams.examBatchMeta);
    return getResultDistribution(ctx, selectedBatch);
  },

  async getPassRateCard(ctx: T_DashboardContext) {
    const exams = await getExamBatches(ctx);
    const selectedBatch = pickExamBatch(ctx, exams.examBatchMeta);
    return getPassRate(ctx, selectedBatch);
  },

  async getRecentResultsCard(ctx: T_DashboardContext) {
    const exams = await getExamBatches(ctx);
    return getRecentResults(ctx, exams.examBatchMeta);
  },

  getLowAttendance,

  /** Options for the class / exam-batch selectors. */
  async getFilterOptions(ctx: T_DashboardContext) {
    const exams = await getExamBatches(ctx);
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
  async getDashboard(
    userId: string | undefined,
    query: T_DashboardQuery,
  ): Promise<T_TeacherDashboardResponse> {
    const ctx = await buildContext(userId, query);

    const [stats, attendanceTrend, classAttendance, schedule, exams] =
      await Promise.all([
        this.getStats(ctx),
        getAttendanceTrend(ctx),
        getClassAttendance(ctx),
        getTodaySchedule(ctx),
        getExamBatches(ctx),
      ]);

    const selectedBatch = pickExamBatch(ctx, exams.examBatchMeta);
    const [resultDistribution, passRateBySubject, recentResults, lowAttendance] =
      await Promise.all([
        getResultDistribution(ctx, selectedBatch),
        getPassRate(ctx, selectedBatch),
        getRecentResults(ctx, exams.examBatchMeta),
        getLowAttendance(ctx),
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
        range: ctx.range as T_DashboardRange,
        todayBs: ctx.today,
      },
    };
  },
};
