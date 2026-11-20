"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.BatchController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const courseId = req.query.courseId;
            const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.BatchService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
                courseId,
                isActive,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Batches fetched successfully!",
                data: {
                    data: result.batches,
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
            const validatedData = (0, validator_1.validateBatchCreate)(req.body);
            const userId = res.locals.context?.userId;
            const batch = await service_1.BatchService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Batch created successfully",
                data: batch,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const batch = await service_1.BatchService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Batch retrieved successfully",
                data: batch,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const id = req.params.id;
            const validatedData = (0, validator_1.validateBatchUpdate)(req.body);
            const userId = res.locals.context?.userId;
            const batch = await service_1.BatchService.update(id, validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Batch updated successfully",
                data: batch,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    promote: async (req, res) => {
        try {
            const batch = await service_1.BatchService.promote(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Batch promoted to the next term", data: batch });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    graduate: async (req, res) => {
        try {
            const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
            const batch = await service_1.BatchService.graduate(req.params.id, reason, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Batch graduated", data: batch });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            const id = req.params.id;
            const userId = res.locals.context?.userId;
            await service_1.BatchService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Batch deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
