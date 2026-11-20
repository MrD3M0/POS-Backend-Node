"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentFeeItemController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.StudentFeeItemController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const studentFeeId = req.query.studentFeeId;
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.StudentFeeItemService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
                studentFeeId,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Student fee items fetched successfully!",
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
            const validatedData = (0, validator_1.validateStudentFeeItemCreate)(req.body);
            const userId = res.locals.context?.userId;
            const item = await service_1.StudentFeeItemService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Student fee item created successfully",
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
            const item = await service_1.StudentFeeItemService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Student fee item retrieved successfully",
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
            const validatedData = (0, validator_1.validateStudentFeeItemUpdate)(req.body);
            const userId = res.locals.context?.userId;
            const item = await service_1.StudentFeeItemService.update(id, validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Student fee item updated successfully",
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
            await service_1.StudentFeeItemService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Student fee item deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
