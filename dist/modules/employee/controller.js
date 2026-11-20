"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.EmployeeController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.EmployeeService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
                isActive,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Employees fetched successfully!",
                data: {
                    data: result.employees,
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
            const validatedData = (0, validator_1.validateEmployeeCreate)(req.body);
            const userId = res.locals.context?.userId;
            const employee = await service_1.EmployeeService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Employee created successfully",
                data: employee,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const employee = await service_1.EmployeeService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Employee retrieved successfully",
                data: employee,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const id = req.params.id;
            const validatedData = (0, validator_1.validateEmployeeUpdate)(req.body);
            const userId = res.locals.context?.userId;
            const employee = await service_1.EmployeeService.update(id, validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Employee updated successfully",
                data: employee,
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
            await service_1.EmployeeService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Employee deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
