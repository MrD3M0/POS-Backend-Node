"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeePaymentMethodLineController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.FeePaymentMethodLineController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.FeePaymentMethodLineService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Fee payment method lines fetched successfully!",
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
            const validatedData = (0, validator_1.validateFeePaymentMethodLineCreate)(req.body);
            const userId = res.locals.context?.userId;
            const line = await service_1.FeePaymentMethodLineService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Fee payment method line created successfully",
                data: line,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const line = await service_1.FeePaymentMethodLineService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Fee payment method line retrieved successfully",
                data: line,
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
            await service_1.FeePaymentMethodLineService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Fee payment method line deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
