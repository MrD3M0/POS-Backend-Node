"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.PayrollController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const result = await service_1.PayrollService.index({
                page: Number(page) || 1,
                limit: Number(limit) || 10,
                search,
                status: req.query.status,
                fiscalYearId: req.query.fiscalYearId,
                yearBs: req.query.yearBs ? Number(req.query.yearBs) : undefined,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Payroll fetched successfully!",
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
            const record = await service_1.PayrollService.create((0, validator_1.validatePayrollCreate)(req.body), res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 201, message: "Payroll created (payslips generated)", data: record });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const record = await service_1.PayrollService.getById(req.params.id);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Payroll retrieved successfully", data: record });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const record = await service_1.PayrollService.update(req.params.id, (0, validator_1.validatePayrollUpdate)(req.body), res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Payroll updated successfully", data: record });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    regenerate: async (req, res) => {
        try {
            const record = await service_1.PayrollService.regenerate(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Payslips regenerated", data: record });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    submit: async (req, res) => {
        try {
            const record = await service_1.PayrollService.submit(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Payroll submitted for approval", data: record });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    approve: async (req, res) => {
        try {
            const record = await service_1.PayrollService.approve(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Payroll approved (attendance locked)", data: record });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    reject: async (req, res) => {
        try {
            const record = await service_1.PayrollService.reject(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Payroll rejected", data: record });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    backToDraft: async (req, res) => {
        try {
            const record = await service_1.PayrollService.backToDraft(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Payroll returned to DRAFT", data: record });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    pay: async (req, res) => {
        try {
            const { paidDateBs } = (0, validator_1.validatePayrollPay)(req.body);
            const record = await service_1.PayrollService.pay(req.params.id, paidDateBs, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Payroll paid (journal posted)", data: record });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            await service_1.PayrollService.delete(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Payroll deleted successfully", data: null });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
