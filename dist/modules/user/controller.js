"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
const service_1 = require("./service");
exports.UserController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const result = await service_1.UserService.index({
                page: Number(page) || 1,
                limit: Number(limit) || 10,
                search,
                role: typeof req.query.role === "string" ? req.query.role : undefined,
                isActive: req.query.isActive !== undefined ? req.query.isActive === "true" : undefined,
                isLocked: req.query.isLocked !== undefined ? req.query.isLocked === "true" : undefined,
                isEmailVerified: req.query.isEmailVerified !== undefined ? req.query.isEmailVerified === "true" : undefined,
                includeDeleted: req.query.includeDeleted === "true",
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Users fetched successfully!",
                data: { data: result.data, pagination: result.pagination },
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    create: async (req, res) => {
        try {
            const user = await service_1.UserService.create((0, validator_1.validateUserCreate)(req.body), res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 201, message: "User created successfully", data: user });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const user = await service_1.UserService.getById(req.params.id);
            return response_1.ResponseHandler.success({ res, code: 200, message: "User retrieved successfully", data: user });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const user = await service_1.UserService.update(req.params.id, (0, validator_1.validateUserUpdate)(req.body), res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "User updated successfully", data: user });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    resetPassword: async (req, res) => {
        try {
            await service_1.UserService.resetPassword(req.params.id, (0, validator_1.validateUserResetPassword)(req.body), res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Password reset successfully", data: null });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    unlock: async (req, res) => {
        try {
            const user = await service_1.UserService.unlock(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "User unlocked successfully", data: user });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    linkPerson: async (req, res) => {
        try {
            const user = await service_1.UserService.linkPerson(req.params.id, (0, validator_1.validateUserLinkPerson)(req.body), res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "User linked successfully", data: user });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    unlinkPerson: async (req, res) => {
        try {
            const user = await service_1.UserService.unlinkPerson(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "User unlinked successfully", data: user });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    verifyEmail: async (req, res) => {
        try {
            const data = (0, validator_1.validateUserVerifyEmail)(req.body);
            const user = await service_1.UserService.verifyEmail(req.params.id, data.reason, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Email verified successfully", data: user });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    restore: async (req, res) => {
        try {
            const user = await service_1.UserService.restore(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "User restored successfully", data: user });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            await service_1.UserService.delete(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "User deleted successfully", data: null });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
