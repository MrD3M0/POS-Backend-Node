"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeInstallmentController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.FeeInstallmentController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const studentFeeItemId = req.query.studentFeeItemId;
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.FeeInstallmentService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
                studentFeeItemId,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Fee installments fetched successfully!",
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
            const validatedData = (0, validator_1.validateFeeInstallmentCreate)(req.body);
            const userId = res.locals.context?.userId;
            const installment = await service_1.FeeInstallmentService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Fee installment created successfully",
                data: installment,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const installment = await service_1.FeeInstallmentService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Fee installment retrieved successfully",
                data: installment,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    bulk: async (req, res) => {
        try {
            const validatedData = (0, validator_1.validateFeeInstallmentBulk)(req.body);
            const userId = res.locals.context?.userId;
            const created = await service_1.FeeInstallmentService.bulk(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Fee installments created successfully",
                data: created,
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
            await service_1.FeeInstallmentService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Fee installment deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
