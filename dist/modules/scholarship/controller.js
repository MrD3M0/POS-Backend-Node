"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScholarshipController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.ScholarshipController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const result = await service_1.ScholarshipService.index({
                page: Number(page) || 1,
                limit: Number(limit) || 10,
                search,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Scholarships fetched successfully!",
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    create: async (req, res) => {
        try {
            const validated = (0, validator_1.validateScholarshipCreate)(req.body);
            const scholarship = await service_1.ScholarshipService.create(validated, res.locals.context?.userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Scholarship created successfully",
                data: scholarship,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const validated = (0, validator_1.validateScholarshipUpdate)(req.body);
            const scholarship = await service_1.ScholarshipService.update(req.params.id, validated, res.locals.context?.userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Scholarship updated successfully",
                data: scholarship,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            await service_1.ScholarshipService.delete(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Scholarship deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    listGrants: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const result = await service_1.ScholarshipService.listGrants({
                page: Number(page) || 1,
                limit: Number(limit) || 10,
                search,
                studentId: req.query.studentId,
                scholarshipId: req.query.scholarshipId,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Scholarship grants fetched successfully!",
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    grant: async (req, res) => {
        try {
            const validated = (0, validator_1.validateScholarshipGrant)(req.body);
            const result = await service_1.ScholarshipService.grant(validated, res.locals.context?.userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Scholarship granted successfully",
                data: result,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    revoke: async (req, res) => {
        try {
            const result = await service_1.ScholarshipService.revoke(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Scholarship revoked successfully",
                data: result,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
