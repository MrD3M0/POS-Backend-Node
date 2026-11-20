"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamMarkController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.ExamMarkController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.ExamMarkService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
                examSubjectId: req.query.examSubjectId || undefined,
                studentId: req.query.studentId || undefined,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Exam marks fetched successfully!",
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
            const validatedData = (0, validator_1.validateExamMarkCreate)(req.body);
            const userId = res.locals.context?.userId;
            const mark = await service_1.ExamMarkService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Exam mark created successfully",
                data: mark,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const mark = await service_1.ExamMarkService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Exam mark retrieved successfully",
                data: mark,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    bulkCreate: async (req, res) => {
        try {
            const validatedData = (0, validator_1.validateExamMarkBulk)(req.body);
            const userId = res.locals.context?.userId;
            const marks = await service_1.ExamMarkService.bulkCreate(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Exam marks created successfully",
                data: marks,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const id = req.params.id;
            const validatedData = (0, validator_1.validateExamMarkUpdate)(req.body);
            const userId = res.locals.context?.userId;
            const mark = await service_1.ExamMarkService.update(id, validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Exam mark updated successfully",
                data: mark,
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
            await service_1.ExamMarkService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Exam mark deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
