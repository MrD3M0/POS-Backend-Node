"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradeScaleController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.GradeScaleController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const result = await service_1.GradeScaleService.index({
                page: Number(page) || 1,
                limit: Number(limit) || 10,
                search,
                includeDeleted: req.query.includeDeleted === "true",
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Grade scale items fetched successfully!",
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
            const item = await service_1.GradeScaleService.create((0, validator_1.validateGradeScaleItemCreate)(req.body), res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 201, message: "Grade scale item created successfully", data: item });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    seedDefault: async (req, res) => {
        try {
            const result = await service_1.GradeScaleService.seedDefault(res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Default grade scale seeded", data: result });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    coverage: async (_req, res) => {
        try {
            const result = await service_1.GradeScaleService.coverage();
            return response_1.ResponseHandler.success({ res, code: 200, message: "Grade scale coverage", data: result });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const item = await service_1.GradeScaleService.getById(req.params.id);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Grade scale item retrieved successfully", data: item });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const item = await service_1.GradeScaleService.update(req.params.id, (0, validator_1.validateGradeScaleItemUpdate)(req.body), res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Grade scale item updated successfully", data: item });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            await service_1.GradeScaleService.delete(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Grade scale item deleted successfully", data: null });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
