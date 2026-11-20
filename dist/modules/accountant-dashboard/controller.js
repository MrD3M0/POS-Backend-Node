"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountantDashboardController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
/**
 * One endpoint per dashboard section, so the frontend can give every card
 * its own loading / empty / error state (a failing section never blocks the
 * others).
 */
exports.AccountantDashboardController = {
    kpis: async (_req, res) => {
        try {
            const data = await service_1.AccountantDashboardService.kpis();
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Accountant dashboard KPIs fetched successfully!",
                data,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    feeAnalytics: async (_req, res) => {
        try {
            const data = await service_1.AccountantDashboardService.feeAnalytics();
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Fee analytics fetched successfully!",
                data,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    collections: async (_req, res) => {
        try {
            const data = await service_1.AccountantDashboardService.collections();
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Collections fetched successfully!",
                data,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    journal: async (_req, res) => {
        try {
            const data = await service_1.AccountantDashboardService.journal();
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Journal summary fetched successfully!",
                data,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    payrollAndAlerts: async (_req, res) => {
        try {
            const data = await service_1.AccountantDashboardService.payrollAndAlerts();
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Payroll summary and alerts fetched successfully!",
                data,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
