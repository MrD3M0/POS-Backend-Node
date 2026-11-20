"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeStructureController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.FeeStructureController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.FeeStructureService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Fee structures fetched successfully!",
                data: {
                    data: result.data,
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
            const validatedData = (0, validator_1.validateFeeStructureCreate)(req.body);
            const userId = res.locals.context?.userId;
            const structure = await service_1.FeeStructureService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Fee structure created successfully",
                data: structure,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const validatedData = (0, validator_1.validateFeeStructureUpdate)(req.body);
            const userId = res.locals.context?.userId;
            const structure = await service_1.FeeStructureService.update(req.params.id, validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Fee structure updated successfully",
                data: structure,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const structure = await service_1.FeeStructureService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Fee structure retrieved successfully",
                data: structure,
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
            await service_1.FeeStructureService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Fee structure deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
