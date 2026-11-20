"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeStructureItemController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.FeeStructureItemController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.FeeStructureItemService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Fee structure items fetched successfully!",
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
            const validatedData = (0, validator_1.validateFeeStructureItemCreate)(req.body);
            const userId = res.locals.context?.userId;
            const item = await service_1.FeeStructureItemService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Fee structure item created successfully",
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
            const item = await service_1.FeeStructureItemService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Fee structure item retrieved successfully",
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
            await service_1.FeeStructureItemService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Fee structure item deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
