"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.AccountController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const result = await service_1.AccountService.index({
                page: Number(page) || 1,
                limit: Number(limit) || 10,
                search,
                type: req.query.type,
                includeDeleted: req.query.includeDeleted === "true",
            });
            return response_1.ResponseHandler.success({ res, code: 200, message: "Accounts fetched successfully!", data: result.data, pagination: result.pagination });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    tree: async (_req, res) => {
        try {
            const data = await service_1.AccountService.tree();
            return response_1.ResponseHandler.success({ res, code: 200, message: "Chart of accounts fetched", data });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    seedDefault: async (req, res) => {
        try {
            const result = await service_1.AccountService.seedDefault(res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Default chart of accounts seeded", data: result });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    create: async (req, res) => {
        try {
            const account = await service_1.AccountService.create((0, validator_1.validateAccountCreate)(req.body), res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 201, message: "Account created successfully", data: account });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const account = await service_1.AccountService.getById(req.params.id);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Account retrieved successfully", data: account });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const account = await service_1.AccountService.update(req.params.id, (0, validator_1.validateAccountUpdate)(req.body), res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Account updated successfully", data: account });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            await service_1.AccountService.delete(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Account deactivated successfully", data: null });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
