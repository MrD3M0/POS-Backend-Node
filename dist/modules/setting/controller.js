"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.SettingController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.SettingService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Settings fetched successfully!",
                data: {
                    data: result.settings,
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
            const validatedData = (0, validator_1.validateSettingCreate)(req.body);
            const userId = res.locals.context?.userId;
            const setting = await service_1.SettingService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Setting created successfully",
                data: setting,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const setting = await service_1.SettingService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Setting retrieved successfully",
                data: setting,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieveByKey: async (req, res) => {
        try {
            const key = req.params.key;
            const setting = await service_1.SettingService.getByKey(key);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Setting retrieved successfully",
                data: setting,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    effective: async (_req, res) => {
        try {
            const settings = await service_1.SettingService.effective();
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Effective settings fetched successfully",
                data: settings,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    institution: async (_req, res) => {
        try {
            const institution = await service_1.SettingService.institution();
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Institution details fetched successfully",
                data: institution,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    upsertByKey: async (req, res) => {
        try {
            const key = req.params.key;
            const { value } = (0, validator_1.validateSettingValueBody)(req.body);
            const setting = await service_1.SettingService.upsertByKey(key, value, res.locals.context?.userId, res.locals.context?.role);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Setting saved successfully",
                data: setting,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const id = req.params.id;
            const validatedData = (0, validator_1.validateSettingUpdate)(req.body);
            const userId = res.locals.context?.userId;
            const setting = await service_1.SettingService.update(id, validatedData, userId, res.locals.context?.role);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Setting updated successfully",
                data: setting,
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
            await service_1.SettingService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Setting deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
