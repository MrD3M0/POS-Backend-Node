"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.SubjectController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.SubjectService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
                isActive,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Subjects fetched successfully!",
                data: {
                    data: result.subjects,
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
            const validatedData = (0, validator_1.validateSubjectCreate)(req.body);
            const userId = res.locals.context?.userId;
            const subject = await service_1.SubjectService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Subject created successfully",
                data: subject,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const subject = await service_1.SubjectService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Subject retrieved successfully",
                data: subject,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const id = req.params.id;
            const validatedData = (0, validator_1.validateSubjectUpdate)(req.body);
            const userId = res.locals.context?.userId;
            const subject = await service_1.SubjectService.update(id, validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Subject updated successfully",
                data: subject,
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
            await service_1.SubjectService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Subject deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
