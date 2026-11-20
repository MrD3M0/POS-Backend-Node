"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherBatchPayController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.TeacherBatchPayController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const teachingAssignmentId = req.query.teachingAssignmentId;
            const yearBs = req.query.yearBs ? Number(req.query.yearBs) : undefined;
            const monthBs = req.query.monthBs ? Number(req.query.monthBs) : undefined;
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.TeacherBatchPayService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
                teachingAssignmentId,
                yearBs,
                monthBs,
            }, {
                userId: res.locals.context?.userId,
                role: res.locals.context?.role,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Teacher batch pays fetched successfully!",
                data: {
                    data: result.pays,
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
            const validatedData = (0, validator_1.validateTeacherBatchPayCreate)(req.body);
            const userId = res.locals.context?.userId;
            const pay = await service_1.TeacherBatchPayService.create(validatedData, userId, res.locals.context?.role);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Teacher batch pay created successfully",
                data: pay,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const pay = await service_1.TeacherBatchPayService.getById(id, {
                userId: res.locals.context?.userId,
                role: res.locals.context?.role,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Teacher batch pay retrieved successfully",
                data: pay,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const id = req.params.id;
            const validatedData = (0, validator_1.validateTeacherBatchPayUpdate)(req.body);
            const userId = res.locals.context?.userId;
            const pay = await service_1.TeacherBatchPayService.update(id, validatedData, userId, res.locals.context?.role);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Teacher batch pay updated successfully",
                data: pay,
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
            await service_1.TeacherBatchPayService.delete(id, userId, res.locals.context?.role);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Teacher batch pay deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
