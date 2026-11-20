"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchTermController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.BatchTermController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const batchId = req.query.batchId;
            const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.BatchTermService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
                batchId,
                isActive,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "BatchTerms fetched successfully!",
                data: {
                    data: result.batchTerms,
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
            const validatedData = (0, validator_1.validateBatchTermCreate)(req.body);
            const userId = res.locals.context?.userId;
            const batchTerm = await service_1.BatchTermService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "BatchTerm created successfully",
                data: batchTerm,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const batchTerm = await service_1.BatchTermService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "BatchTerm retrieved successfully",
                data: batchTerm,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const id = req.params.id;
            const validatedData = (0, validator_1.validateBatchTermUpdate)(req.body);
            const userId = res.locals.context?.userId;
            const batchTerm = await service_1.BatchTermService.update(id, validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "BatchTerm updated successfully",
                data: batchTerm,
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
            await service_1.BatchTermService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "BatchTerm deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
