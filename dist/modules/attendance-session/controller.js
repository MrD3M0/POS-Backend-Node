"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceSessionController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
const getActor = (res) => ({
    userId: res.locals.context?.userId,
    role: res.locals.context?.role,
});
exports.AttendanceSessionController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const result = await service_1.AttendanceSessionService.index({
                page: Number(page) || 1,
                limit: Number(limit) || 10,
                search,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Attendance sessions fetched successfully!",
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    create: async (req, res) => {
        try {
            const validatedData = (0, validator_1.validateAttendanceSessionCreate)(req.body);
            const session = await service_1.AttendanceSessionService.create(validatedData, getActor(res));
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Attendance session created successfully",
                data: session,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const session = await service_1.AttendanceSessionService.getById(req.params.id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Attendance session retrieved successfully",
                data: session,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    roster: async (req, res) => {
        try {
            const roster = await service_1.AttendanceSessionService.roster(req.params.id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Attendance roster retrieved successfully",
                data: roster,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const validatedData = (0, validator_1.validateAttendanceSessionUpdate)(req.body);
            const session = await service_1.AttendanceSessionService.update(req.params.id, validatedData, getActor(res));
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Attendance session updated successfully",
                data: session,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    unlock: async (req, res) => {
        try {
            const reason = typeof req.body?.reason === "string" ? req.body.reason : "";
            const session = await service_1.AttendanceSessionService.unlock(req.params.id, reason, getActor(res));
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Attendance session unlocked successfully",
                data: session,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            await service_1.AttendanceSessionService.delete(req.params.id, getActor(res));
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Attendance session deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
