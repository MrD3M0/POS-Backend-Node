"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalaryStructureController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.SalaryStructureController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.SalaryStructureService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
                isActive,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Salary structures fetched successfully!",
                data: {
                    data: result.structures,
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
            const validatedData = (0, validator_1.validateSalaryStructureCreate)(req.body);
            const userId = res.locals.context?.userId;
            const structure = await service_1.SalaryStructureService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Salary structure created successfully",
                data: structure,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const structure = await service_1.SalaryStructureService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Salary structure retrieved successfully",
                data: structure,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const id = req.params.id;
            const validatedData = (0, validator_1.validateSalaryStructureUpdate)(req.body);
            const userId = res.locals.context?.userId;
            const structure = await service_1.SalaryStructureService.update(id, validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Salary structure updated successfully",
                data: structure,
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
            await service_1.SalaryStructureService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Salary structure deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
