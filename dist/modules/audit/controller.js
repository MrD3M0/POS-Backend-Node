"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
exports.AuditLogController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const result = await service_1.AuditLogService.index({
                page: Number(page) || 1,
                limit: Number(limit) || 20,
                search,
                entity: req.query.entity,
                entityId: req.query.entityId,
                action: req.query.action,
                userId: req.query.userId,
                from: req.query.from,
                to: req.query.to,
            });
            return response_1.ResponseHandler.success({ res, code: 200, message: "Audit log fetched", data: result });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    options: async (_req, res) => {
        try {
            const options = await service_1.AuditLogService.filterOptions();
            return response_1.ResponseHandler.success({ res, code: 200, message: "Audit filters fetched", data: options });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const log = await service_1.AuditLogService.getById(req.params.id);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Audit entry fetched", data: log });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
