"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
const getActor = (res) => ({
    userId: res.locals.context?.userId,
    role: res.locals.context?.role,
});
const asString = (value) => typeof value === "string" && value.length > 0 ? value : undefined;
exports.ResultController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const result = await service_1.ResultService.index({
                page: Number(page) || 1,
                limit: Number(limit) || 10,
                search,
                studentId: asString(req.query.studentId),
                examId: asString(req.query.examId),
                status: asString(req.query.status),
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Results fetched successfully!",
                data: { data: result.results, pagination: result.pagination },
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    create: async (req, res) => {
        try {
            const validatedData = (0, validator_1.validateResultCreate)(req.body);
            const result = await service_1.ResultService.create(validatedData, getActor(res));
            return response_1.ResponseHandler.success({ res, code: 201, message: "Result created successfully", data: result });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const result = await service_1.ResultService.getById(req.params.id);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Result retrieved successfully", data: result });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const validatedData = (0, validator_1.validateResultUpdate)(req.body);
            const result = await service_1.ResultService.update(req.params.id, validatedData, getActor(res));
            return response_1.ResponseHandler.success({ res, code: 200, message: "Result updated successfully", data: result });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    transition: async (req, res) => {
        try {
            const validatedData = (0, validator_1.validateResultTransition)(req.body);
            const result = await service_1.ResultService.transition(req.params.id, validatedData.to, getActor(res));
            return response_1.ResponseHandler.success({ res, code: 200, message: "Result transitioned successfully", data: result });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    recompute: async (req, res) => {
        try {
            const result = await service_1.ResultService.recompute(req.params.id, getActor(res));
            return response_1.ResponseHandler.success({ res, code: 200, message: "Result recomputed successfully", data: result });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    bulkApproveExam: async (req, res) => {
        try {
            const examId = req.params.examId;
            const summary = await service_1.ResultService.bulkApproveExam(examId, getActor(res));
            return response_1.ResponseHandler.success({ res, code: 200, message: "Bulk approve completed", data: summary });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            await service_1.ResultService.delete(req.params.id, getActor(res));
            return response_1.ResponseHandler.success({ res, code: 200, message: "Result deleted successfully", data: null });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
