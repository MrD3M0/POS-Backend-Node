"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HolidayController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
const parseBool = (value) => value === undefined ? undefined : value === "true";
exports.HolidayController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const result = await service_1.HolidayService.index({
                page: Number(page) || 1,
                limit: Number(limit) || 10,
                search,
                yearBs: req.query.yearBs ? Number(req.query.yearBs) : undefined,
                monthBs: req.query.monthBs ? Number(req.query.monthBs) : undefined,
                appliesToStudents: parseBool(req.query.appliesToStudents),
                appliesToEmployees: parseBool(req.query.appliesToEmployees),
                includeDeleted: req.query.includeDeleted === "true",
                sort: req.query.sort,
                order: req.query.order,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Holidays fetched successfully",
                data: result,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const holiday = await service_1.HolidayService.getById(req.params.id);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Holiday retrieved", data: holiday });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    create: async (req, res) => {
        try {
            const data = validator_1.holidayCreateSchema.parse(req.body);
            const holiday = await service_1.HolidayService.create(data, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 201, message: "Holiday created", data: holiday });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const data = validator_1.holidayUpdateSchema.parse(req.body);
            const holiday = await service_1.HolidayService.update(req.params.id, data, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Holiday updated", data: holiday });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            await service_1.HolidayService.delete(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Holiday deleted", data: null });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    restore: async (req, res) => {
        try {
            const holiday = await service_1.HolidayService.restore(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Holiday restored", data: holiday });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    bulkImport: async (req, res) => {
        try {
            const data = validator_1.holidayBulkSchema.parse(req.body);
            const result = await service_1.HolidayService.bulkImport(data, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Holiday import completed", data: result });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    bulkCreate: async (req, res) => {
        try {
            const data = validator_1.holidayBulkCreateSchema.parse(req.body);
            const result = await service_1.HolidayService.bulkCreate(data, res.locals.context?.userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: `${result.created} holiday(s) created, ${result.skipped} skipped`,
                data: result,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    weeklyOffs: async (req, res) => {
        try {
            const data = validator_1.weeklyOffSchema.parse(req.body);
            const result = await service_1.HolidayService.generateWeeklyOffs(data, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Weekly off days generated", data: result });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
