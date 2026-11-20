"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeHeadController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.FeeHeadController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const result = await service_1.FeeHeadService.index({ page: Number(page) || 1, limit: Number(limit) || 10, search });
            return response_1.ResponseHandler.success({ res, code: 200, message: "Fee heads fetched successfully!", data: { data: result.data, pagination: result.pagination } });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    create: async (req, res) => {
        try {
            const head = await service_1.FeeHeadService.create((0, validator_1.validateFeeHeadCreate)(req.body), res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 201, message: "Fee head created successfully", data: head });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const head = await service_1.FeeHeadService.getById(req.params.id);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Fee head retrieved successfully", data: head });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const head = await service_1.FeeHeadService.update(req.params.id, (0, validator_1.validateFeeHeadUpdate)(req.body), res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Fee head updated successfully", data: head });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            await service_1.FeeHeadService.delete(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Fee head deleted successfully", data: null });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
