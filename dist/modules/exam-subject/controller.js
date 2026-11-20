"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamSubjectController = void 0;
const service_1 = require("./service");
const workflow_1 = require("./workflow");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
const getActor = (res) => ({
    userId: res.locals.context?.userId,
    role: res.locals.context?.role,
});
const asString = (value) => typeof value === "string" && value.length > 0 ? value : undefined;
exports.ExamSubjectController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.ExamSubjectService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Exam subjects fetched successfully!",
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
            const validatedData = (0, validator_1.validateExamSubjectCreate)(req.body);
            const userId = res.locals.context?.userId;
            const item = await service_1.ExamSubjectService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Exam subject created successfully",
                data: item,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const item = await service_1.ExamSubjectService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Exam subject retrieved successfully",
                data: item,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const id = req.params.id;
            const validatedData = (0, validator_1.validateExamSubjectUpdate)(req.body);
            const userId = res.locals.context?.userId;
            const item = await service_1.ExamSubjectService.update(id, validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Exam subject updated successfully",
                data: item,
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
            await service_1.ExamSubjectService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Exam subject deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    // ── Group-level result workflow ──────────────────────────────────────
    groups: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const result = await workflow_1.ExamSubjectWorkflow.groups({
                page: Number(page) || 1,
                limit: Number(limit) || 20,
                search,
                batchId: asString(req.query.batchId),
                termId: asString(req.query.termId),
                subjectId: asString(req.query.subjectId),
                examId: asString(req.query.examId),
                status: asString(req.query.status),
            }, getActor(res));
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Result groups fetched successfully!",
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    submit: async (req, res) => {
        try {
            const item = await workflow_1.ExamSubjectWorkflow.submit(req.params.id, getActor(res));
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Marks submitted for approval",
                data: item,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    bulkReview: async (req, res) => {
        try {
            const input = (0, validator_1.validateExamSubjectReview)(req.body);
            const summary = await workflow_1.ExamSubjectWorkflow.bulkReview(input, getActor(res));
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: input.action === "APPROVE"
                    ? "Subjects approved"
                    : "Subjects rejected",
                data: summary,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    publish: async (req, res) => {
        try {
            const input = (0, validator_1.validateResultPublish)(req.body);
            const summary = await workflow_1.ExamSubjectWorkflow.publish(input, getActor(res));
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Results published",
                data: summary,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
