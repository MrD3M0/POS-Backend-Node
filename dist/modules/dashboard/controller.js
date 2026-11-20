"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const getActor = (res) => ({
    userId: res.locals.context?.userId,
    role: res.locals.context?.role,
});
exports.DashboardController = {
    admin: async (_req, res) => {
        try {
            const data = await service_1.DashboardService.admin();
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Admin dashboard fetched successfully!",
                data,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    principal: async (_req, res) => {
        try {
            const data = await service_1.DashboardService.principal(getActor(res));
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Principal dashboard fetched successfully!",
                data,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    accountant: async (_req, res) => {
        try {
            const data = await service_1.DashboardService.accountant();
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Accountant dashboard fetched successfully!",
                data,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    teacher: async (_req, res) => {
        try {
            const data = await service_1.DashboardService.teacher(getActor(res));
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Teacher dashboard fetched successfully!",
                data,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    staff: async (_req, res) => {
        try {
            const data = await service_1.DashboardService.staff(getActor(res));
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Staff dashboard fetched successfully!",
                data,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
