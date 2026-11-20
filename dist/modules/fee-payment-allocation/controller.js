"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeePaymentAllocationController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.FeePaymentAllocationController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.FeePaymentAllocationService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Fee payment allocations fetched successfully!",
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
            const validatedData = (0, validator_1.validateFeePaymentAllocationCreate)(req.body);
            const userId = res.locals.context?.userId;
            const allocation = await service_1.FeePaymentAllocationService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Fee payment allocation created successfully",
                data: allocation,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const allocation = await service_1.FeePaymentAllocationService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Fee payment allocation retrieved successfully",
                data: allocation,
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
            await service_1.FeePaymentAllocationService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Fee payment allocation deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
