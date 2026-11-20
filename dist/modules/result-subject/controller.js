"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultSubjectController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.ResultSubjectController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const resultId = req.query.resultId;
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.ResultSubjectService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
                resultId,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Result subjects fetched successfully!",
                data: {
                    data: result.resultSubjects,
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
            const validatedData = (0, validator_1.validateResultSubjectCreate)(req.body);
            const userId = res.locals.context?.userId;
            const resultSubject = await service_1.ResultSubjectService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Result subject created successfully",
                data: resultSubject,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const resultSubject = await service_1.ResultSubjectService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Result subject retrieved successfully",
                data: resultSubject,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const id = req.params.id;
            const validatedData = (0, validator_1.validateResultSubjectUpdate)(req.body);
            const userId = res.locals.context?.userId;
            const resultSubject = await service_1.ResultSubjectService.update(id, validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Result subject updated successfully",
                data: resultSubject,
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
            await service_1.ResultSubjectService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Result subject deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
