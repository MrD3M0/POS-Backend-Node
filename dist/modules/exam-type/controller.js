"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamTypeController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.ExamTypeController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const result = await service_1.ExamTypeService.index({ page: Number(page) || 1, limit: Number(limit) || 10, search });
            return response_1.ResponseHandler.success({ res, code: 200, message: "Exam types fetched successfully!", data: result.data, pagination: result.pagination });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    create: async (req, res) => {
        try {
            const examType = await service_1.ExamTypeService.create((0, validator_1.validateExamTypeCreate)(req.body), res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 201, message: "Exam type created successfully", data: examType });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const examType = await service_1.ExamTypeService.getById(req.params.id);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Exam type retrieved successfully", data: examType });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const examType = await service_1.ExamTypeService.update(req.params.id, (0, validator_1.validateExamTypeUpdate)(req.body), res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Exam type updated successfully", data: examType });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            await service_1.ExamTypeService.delete(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Exam type deleted successfully", data: null });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
