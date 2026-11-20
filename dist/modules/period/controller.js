"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeriodController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.PeriodController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.PeriodService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
                isActive,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Periods fetched successfully!",
                data: {
                    data: result.periods,
                    pagination: result.pagination,
                },
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    create: async (req, res) => {
        try {
            const validatedData = (0, validator_1.validatePeriodCreate)(req.body);
            const userId = res.locals.context?.userId;
            const period = await service_1.PeriodService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Period created successfully",
                data: period,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const period = await service_1.PeriodService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Period retrieved successfully",
                data: period,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const id = req.params.id;
            const validatedData = (0, validator_1.validatePeriodUpdate)(req.body);
            const userId = res.locals.context?.userId;
            const period = await service_1.PeriodService.update(id, validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Period updated successfully",
                data: period,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            const id = req.params.id;
            const userId = res.locals.context?.userId;
            await service_1.PeriodService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Period deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
