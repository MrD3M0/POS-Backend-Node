"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherDashboardController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const asString = (value) => typeof value === "string" && value.length > 0 ? value : undefined;
const queryOf = (req) => ({
    assignmentId: asString(req.query.assignmentId),
    examBatchId: asString(req.query.examBatchId),
    range: asString(req.query.range),
});
const userIdOf = (res) => res.locals.context?.userId;
/**
 * One endpoint per dashboard card. Each call only loads what its card needs,
 * so a failing card never takes the other cards down with it.
 */
exports.TeacherDashboardController = {
    index: async (req, res) => {
        try {
            const dashboard = await service_1.TeacherDashboardService.getDashboard(userIdOf(res), queryOf(req));
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Teacher dashboard fetched successfully!",
                data: dashboard,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    stats: async (req, res) => {
        try {
            const ctx = await service_1.TeacherDashboardService.getContext(userIdOf(res), queryOf(req));
            const stats = await service_1.TeacherDashboardService.getStats(ctx);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Dashboard stats fetched successfully!",
                data: stats,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    attendanceTrend: async (req, res) => {
        try {
            const ctx = await service_1.TeacherDashboardService.getContext(userIdOf(res), queryOf(req));
            const attendanceTrend = await service_1.TeacherDashboardService.getAttendanceTrend(ctx);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Attendance trend fetched successfully!",
                data: attendanceTrend,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    classAttendance: async (req, res) => {
        try {
            const ctx = await service_1.TeacherDashboardService.getContext(userIdOf(res), queryOf(req));
            const classAttendance = await service_1.TeacherDashboardService.getClassAttendance(ctx);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Class attendance fetched successfully!",
                data: classAttendance,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    todaySchedule: async (req, res) => {
        try {
            const ctx = await service_1.TeacherDashboardService.getContext(userIdOf(res), queryOf(req));
            // Whole card object: items + pending count + holiday + date/day.
            const schedule = await service_1.TeacherDashboardService.getTodaySchedule(ctx);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Today's schedule fetched successfully!",
                data: schedule,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    weekSchedule: async (req, res) => {
        try {
            const ctx = await service_1.TeacherDashboardService.getContext(userIdOf(res), queryOf(req));
            const week = await service_1.TeacherDashboardService.getWeekSchedule(ctx);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Week schedule fetched successfully!",
                data: week,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    examBatches: async (req, res) => {
        try {
            const ctx = await service_1.TeacherDashboardService.getContext(userIdOf(res), queryOf(req));
            const data = await service_1.TeacherDashboardService.getExamBatchesCard(ctx);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Upcoming exams fetched successfully!",
                data,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    resultDistribution: async (req, res) => {
        try {
            const ctx = await service_1.TeacherDashboardService.getContext(userIdOf(res), queryOf(req));
            const data = await service_1.TeacherDashboardService.getResultDistributionCard(ctx);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Result distribution fetched successfully!",
                data,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    passRate: async (req, res) => {
        try {
            const ctx = await service_1.TeacherDashboardService.getContext(userIdOf(res), queryOf(req));
            const data = await service_1.TeacherDashboardService.getPassRateCard(ctx);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Pass rate fetched successfully!",
                data,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    recentResults: async (req, res) => {
        try {
            const ctx = await service_1.TeacherDashboardService.getContext(userIdOf(res), queryOf(req));
            const data = await service_1.TeacherDashboardService.getRecentResultsCard(ctx);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Recent results fetched successfully!",
                data,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    lowAttendance: async (req, res) => {
        try {
            const ctx = await service_1.TeacherDashboardService.getContext(userIdOf(res), queryOf(req));
            const data = await service_1.TeacherDashboardService.getLowAttendance(ctx);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Low attendance students fetched successfully!",
                data,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    filters: async (req, res) => {
        try {
            const ctx = await service_1.TeacherDashboardService.getContext(userIdOf(res), queryOf(req));
            const data = await service_1.TeacherDashboardService.getFilterOptions(ctx);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Dashboard filters fetched successfully!",
                data,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
