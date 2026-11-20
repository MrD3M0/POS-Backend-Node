"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeePaymentController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.FeePaymentController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const studentId = req.query.studentId;
            const fiscalYearId = req.query.fiscalYearId;
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.FeePaymentService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
                studentId,
                fiscalYearId,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Fee payments fetched successfully!",
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
            const validatedData = (0, validator_1.validateFeePaymentCreate)(req.body);
            const userId = res.locals.context?.userId;
            const payment = await service_1.FeePaymentService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Fee payment created successfully",
                data: payment,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const payment = await service_1.FeePaymentService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Fee payment retrieved successfully",
                data: payment,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    cancel: async (req, res) => {
        try {
            const id = req.params.id;
            const validatedData = (0, validator_1.validateFeePaymentCancel)(req.body);
            const reason = validatedData.reason ?? validatedData.cancelReason ?? "Cancelled";
            const userId = res.locals.context?.userId;
            const payment = await service_1.FeePaymentService.cancel(id, userId, reason);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Fee payment cancelled successfully",
                data: payment,
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
            await service_1.FeePaymentService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Fee payment deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
