"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchTermSubjectController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.BatchTermSubjectController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const batchTermId = req.query.batchTermId;
            const subjectId = req.query.subjectId;
            const isElective = req.query.isElective !== undefined ? req.query.isElective === "true" : undefined;
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.BatchTermSubjectService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
                batchTermId,
                subjectId,
                isElective,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "BatchTermSubjects fetched successfully!",
                data: {
                    data: result.batchTermSubjects,
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
            const validatedData = (0, validator_1.validateBatchTermSubjectCreate)(req.body);
            const userId = res.locals.context?.userId;
            const batchTermSubject = await service_1.BatchTermSubjectService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "BatchTermSubject created successfully",
                data: batchTermSubject,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    bulkCreate: async (req, res) => {
        try {
            const validatedData = (0, validator_1.validateBatchTermSubjectBulkCreate)(req.body);
            const userId = res.locals.context?.userId;
            const result = await service_1.BatchTermSubjectService.bulkCreate(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: `${result.created} subject${result.created > 1 ? "s" : ""} assigned successfully`,
                data: result,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const batchTermSubject = await service_1.BatchTermSubjectService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "BatchTermSubject retrieved successfully",
                data: batchTermSubject,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const id = req.params.id;
            const validatedData = (0, validator_1.validateBatchTermSubjectUpdate)(req.body);
            const userId = res.locals.context?.userId;
            const batchTermSubject = await service_1.BatchTermSubjectService.update(id, validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "BatchTermSubject updated successfully",
                data: batchTermSubject,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    copy: async (req, res) => {
        try {
            const fromBatchTermId = typeof req.body?.fromBatchTermId === "string" ? req.body.fromBatchTermId : "";
            const toBatchTermId = typeof req.body?.toBatchTermId === "string" ? req.body.toBatchTermId : "";
            const result = await service_1.BatchTermSubjectService.copy(fromBatchTermId, toBatchTermId, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Syllabus copied", data: result });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            const id = req.params.id;
            const userId = res.locals.context?.userId;
            await service_1.BatchTermSubjectService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "BatchTermSubject deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
