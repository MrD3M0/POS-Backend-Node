"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeAttendanceController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.EmployeeAttendanceController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const result = await service_1.EmployeeAttendanceService.index({
                page: Number(page) || 1,
                limit: Number(limit) || 10,
                search,
                status: req.query.status,
                employeeId: req.query.employeeId,
                dateBs: req.query.dateBs,
                yearBs: req.query.yearBs ? Number(req.query.yearBs) : undefined,
                monthBs: req.query.monthBs ? Number(req.query.monthBs) : undefined,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Employee attendances fetched successfully!",
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
            const record = await service_1.EmployeeAttendanceService.create((0, validator_1.validateEmployeeAttendanceCreate)(req.body), res.locals.context?.userId, res.locals.context?.role);
            return response_1.ResponseHandler.success({ res, code: 201, message: "Employee attendance created", data: record });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    bulkMark: async (req, res) => {
        try {
            const result = await service_1.EmployeeAttendanceService.bulkMark((0, validator_1.validateEmployeeAttendanceBulk)(req.body), res.locals.context?.userId, res.locals.context?.role);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Bulk attendance marked", data: result });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const record = await service_1.EmployeeAttendanceService.getById(req.params.id);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Employee attendance retrieved", data: record });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const record = await service_1.EmployeeAttendanceService.update(req.params.id, (0, validator_1.validateEmployeeAttendanceUpdate)(req.body), res.locals.context?.userId, res.locals.context?.role);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Employee attendance updated", data: record });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            await service_1.EmployeeAttendanceService.delete(req.params.id, res.locals.context?.userId, res.locals.context?.role);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Employee attendance deleted", data: null });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
