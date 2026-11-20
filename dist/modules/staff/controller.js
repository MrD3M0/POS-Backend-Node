"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.StaffController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.StaffService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Staff fetched successfully!",
                data: {
                    data: result.staffs,
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
            const validatedData = (0, validator_1.validateStaffCreate)(req.body);
            const userId = res.locals.context?.userId;
            const staff = await service_1.StaffService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Staff created successfully",
                data: staff,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    me: async (req, res) => {
        try {
            const userId = res.locals.context?.userId;
            const staff = await service_1.StaffService.getMe(userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Staff retrieved successfully",
                data: staff,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const staff = await service_1.StaffService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Staff retrieved successfully",
                data: staff,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const id = req.params.id;
            const validatedData = (0, validator_1.validateStaffUpdate)(req.body);
            const userId = res.locals.context?.userId;
            const staff = await service_1.StaffService.update(id, validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Staff updated successfully",
                data: staff,
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
            await service_1.StaffService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Staff deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
