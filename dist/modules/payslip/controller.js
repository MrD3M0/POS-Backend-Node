"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayslipController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.PayslipController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const result = await service_1.PayslipService.index({
                page: Number(page) || 1,
                limit: Number(limit) || 10,
                search,
                payrollId: req.query.payrollId,
                employeeId: req.query.employeeId,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Payslips fetched successfully!",
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
            const slip = await service_1.PayslipService.create((0, validator_1.validatePayslipCreate)(req.body), res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 201, message: "Payslip created successfully", data: slip });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const slip = await service_1.PayslipService.getById(req.params.id);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Payslip retrieved successfully", data: slip });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const slip = await service_1.PayslipService.update(req.params.id, (0, validator_1.validatePayslipUpdate)(req.body), res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Payslip updated successfully", data: slip });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            await service_1.PayslipService.delete(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Payslip deleted successfully", data: null });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
