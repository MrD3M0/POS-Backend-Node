"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrincipalController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.PrincipalController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.PrincipalService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Principals fetched successfully!",
                data: {
                    data: result.principals,
                    pagination: result.pagination,
                },
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    create: async (req, res) => {
        try {
            const validatedData = (0, validator_1.validatePrincipalCreate)(req.body);
            const userId = res.locals.context?.userId;
            const principal = await service_1.PrincipalService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Principal created successfully",
                data: principal,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const principal = await service_1.PrincipalService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Principal retrieved successfully",
                data: principal,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const id = req.params.id;
            const validatedData = (0, validator_1.validatePrincipalUpdate)(req.body);
            const userId = res.locals.context?.userId;
            const principal = await service_1.PrincipalService.update(id, validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Principal updated successfully",
                data: principal,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            const id = req.params.id;
            const userId = res.locals.context?.userId;
            await service_1.PrincipalService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Principal deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
