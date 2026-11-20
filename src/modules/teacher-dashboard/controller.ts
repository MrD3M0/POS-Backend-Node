import { Request, Response } from "express";
import { TeacherDashboardService, type T_DashboardQuery } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";

const asString = (value: unknown) =>
  typeof value === "string" && value.length > 0 ? value : undefined;

const queryOf = (req: Request): T_DashboardQuery => ({
  assignmentId: asString(req.query.assignmentId),
  examBatchId: asString(req.query.examBatchId),
  range: asString(req.query.range),
});

const userIdOf = (res: Response) =>
  res.locals.context?.userId as string | undefined;

/**
 * One endpoint per dashboard card. Each call only loads what its card needs,
 * so a failing card never takes the other cards down with it.
 */
export const TeacherDashboardController = {
  index: async (req: Request, res: Response) => {
    try {
      const dashboard = await TeacherDashboardService.getDashboard(
        userIdOf(res),
        queryOf(req),
      );
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Teacher dashboard fetched successfully!",
        data: dashboard,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  stats: async (req: Request, res: Response) => {
    try {
      const ctx = await TeacherDashboardService.getContext(
        userIdOf(res),
        queryOf(req),
      );
      const stats = await TeacherDashboardService.getStats(ctx);
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Dashboard stats fetched successfully!",
        data: stats,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  attendanceTrend: async (req: Request, res: Response) => {
    try {
      const ctx = await TeacherDashboardService.getContext(
        userIdOf(res),
        queryOf(req),
      );
      const attendanceTrend = await TeacherDashboardService.getAttendanceTrend(ctx);
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Attendance trend fetched successfully!",
        data: attendanceTrend,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  classAttendance: async (req: Request, res: Response) => {
    try {
      const ctx = await TeacherDashboardService.getContext(
        userIdOf(res),
        queryOf(req),
      );
      const classAttendance =
        await TeacherDashboardService.getClassAttendance(ctx);
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Class attendance fetched successfully!",
        data: classAttendance,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  todaySchedule: async (req: Request, res: Response) => {
    try {
      const ctx = await TeacherDashboardService.getContext(
        userIdOf(res),
        queryOf(req),
      );
      // Whole card object: items + pending count + holiday + date/day.
      const schedule = await TeacherDashboardService.getTodaySchedule(ctx);
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Today's schedule fetched successfully!",
        data: schedule,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  weekSchedule: async (req: Request, res: Response) => {
    try {
      const ctx = await TeacherDashboardService.getContext(
        userIdOf(res),
        queryOf(req),
      );
      const week = await TeacherDashboardService.getWeekSchedule(ctx);
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Week schedule fetched successfully!",
        data: week,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  examBatches: async (req: Request, res: Response) => {
    try {
      const ctx = await TeacherDashboardService.getContext(
        userIdOf(res),
        queryOf(req),
      );
      const data = await TeacherDashboardService.getExamBatchesCard(ctx);
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Upcoming exams fetched successfully!",
        data,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  resultDistribution: async (req: Request, res: Response) => {
    try {
      const ctx = await TeacherDashboardService.getContext(
        userIdOf(res),
        queryOf(req),
      );
      const data = await TeacherDashboardService.getResultDistributionCard(ctx);
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Result distribution fetched successfully!",
        data,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  passRate: async (req: Request, res: Response) => {
    try {
      const ctx = await TeacherDashboardService.getContext(
        userIdOf(res),
        queryOf(req),
      );
      const data = await TeacherDashboardService.getPassRateCard(ctx);
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Pass rate fetched successfully!",
        data,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  recentResults: async (req: Request, res: Response) => {
    try {
      const ctx = await TeacherDashboardService.getContext(
        userIdOf(res),
        queryOf(req),
      );
      const data = await TeacherDashboardService.getRecentResultsCard(ctx);
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Recent results fetched successfully!",
        data,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  lowAttendance: async (req: Request, res: Response) => {
    try {
      const ctx = await TeacherDashboardService.getContext(
        userIdOf(res),
        queryOf(req),
      );
      const data = await TeacherDashboardService.getLowAttendance(ctx);
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Low attendance students fetched successfully!",
        data,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  filters: async (req: Request, res: Response) => {
    try {
      const ctx = await TeacherDashboardService.getContext(
        userIdOf(res),
        queryOf(req),
      );
      const data = await TeacherDashboardService.getFilterOptions(ctx);
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Dashboard filters fetched successfully!",
        data,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
