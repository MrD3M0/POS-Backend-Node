"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiscalYearController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.FiscalYearController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const result = await service_1.FiscalYearService.index({ page: Number(page) || 1, limit: Number(limit) || 10, search });
            return response_1.ResponseHandler.success({ res, code: 200, message: "Fiscal years fetched successfully!", data: result.data, pagination: result.pagination });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    create: async (req, res) => {
        try {
            const year = await service_1.FiscalYearService.create((0, validator_1.validateFiscalYearCreate)(req.body), res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 201, message: "Fiscal year created successfully", data: year });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const year = await service_1.FiscalYearService.getById(req.params.id);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Fiscal year retrieved successfully", data: year });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const year = await service_1.FiscalYearService.update(req.params.id, (0, validator_1.validateFiscalYearUpdate)(req.body), res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Fiscal year updated successfully", data: year });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    setCurrent: async (req, res) => {
        try {
            const year = await service_1.FiscalYearService.setCurrent(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Current fiscal year updated", data: year });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    closePreview: async (req, res) => {
        try {
            const preview = await service_1.FiscalYearService.closePreview(req.params.id);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Fiscal year close preview", data: preview });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    close: async (req, res) => {
        try {
            const reason = typeof req.body?.reason === "string" ? req.body.reason : "";
            const result = await service_1.FiscalYearService.close(req.params.id, reason, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Fiscal year closed", data: result });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            await service_1.FiscalYearService.delete(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Fiscal year deleted successfully", data: null });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
