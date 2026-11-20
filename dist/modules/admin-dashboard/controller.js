"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminDashboardController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
exports.AdminDashboardController = {
    overview: async (_req, res) => {
        try {
            const data = await service_1.AdminDashboardService.overview();
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Dashboard fetched successfully",
                data,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    health: async (_req, res) => {
        try {
            const data = await service_1.AdminDashboardService.healthChecks();
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Health checks fetched successfully",
                data,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
