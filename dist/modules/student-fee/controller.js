"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentFeeController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.StudentFeeController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const studentId = req.query.studentId;
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.StudentFeeService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
                studentId,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Student fees fetched successfully!",
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
            const validatedData = (0, validator_1.validateStudentFeeCreate)(req.body);
            const userId = res.locals.context?.userId;
            const fee = await service_1.StudentFeeService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Student fee created successfully",
                data: fee,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    bulk: async (req, res) => {
        try {
            const validatedData = (0, validator_1.validateStudentFeeBulk)(req.body);
            const userId = res.locals.context?.userId;
            const result = await service_1.StudentFeeService.assignToMany(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Student fees assigned successfully",
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
            const fee = await service_1.StudentFeeService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Student fee retrieved successfully",
                data: fee,
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
            await service_1.StudentFeeService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Student fee deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
