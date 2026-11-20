"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.PaymentMethodController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const result = await service_1.PaymentMethodService.index({ page: Number(page) || 1, limit: Number(limit) || 10, search });
            return response_1.ResponseHandler.success({ res, code: 200, message: "Payment methods fetched successfully!", data: result.data, pagination: result.pagination });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    create: async (req, res) => {
        try {
            const paymentMethod = await service_1.PaymentMethodService.create((0, validator_1.validatePaymentMethodCreate)(req.body), res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 201, message: "Payment method created successfully", data: paymentMethod });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const paymentMethod = await service_1.PaymentMethodService.getById(req.params.id);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Payment method retrieved successfully", data: paymentMethod });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const paymentMethod = await service_1.PaymentMethodService.update(req.params.id, (0, validator_1.validatePaymentMethodUpdate)(req.body), res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Payment method updated successfully", data: paymentMethod });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            await service_1.PaymentMethodService.delete(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Payment method deleted successfully", data: null });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
