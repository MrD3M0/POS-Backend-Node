"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.OtpController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.OtpService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "OTPs fetched successfully!",
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
            const validatedData = (0, validator_1.validateOtpCreate)(req.body);
            const otp = await service_1.OtpService.create(validatedData);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "OTP created successfully",
                data: otp,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const otp = await service_1.OtpService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "OTP retrieved successfully",
                data: otp,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            const id = req.params.id;
            await service_1.OtpService.delete(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "OTP deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
