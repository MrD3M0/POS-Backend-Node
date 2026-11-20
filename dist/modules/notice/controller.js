"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoticeController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
const getActor = (res) => ({
    userId: res.locals.context?.userId,
    role: res.locals.context?.role,
});
exports.NoticeController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const showDrafts = req.query.showDrafts === "true" || req.query.showDrafts === "1";
            const result = await service_1.NoticeService.index({ page: Number(page) || 1, limit: Number(limit) || 10, search, showDrafts }, getActor(res));
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Notices fetched successfully!",
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
            const validatedData = (0, validator_1.validateNoticeCreate)(req.body);
            const notice = await service_1.NoticeService.create(validatedData, res.locals.context?.userId, getActor(res));
            return response_1.ResponseHandler.success({ res, code: 201, message: "Notice created successfully", data: notice });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const notice = await service_1.NoticeService.getById(req.params.id, getActor(res));
            return response_1.ResponseHandler.success({ res, code: 200, message: "Notice retrieved successfully", data: notice });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const validatedData = (0, validator_1.validateNoticeUpdate)(req.body);
            const updated = await service_1.NoticeService.update(req.params.id, validatedData, res.locals.context?.userId, getActor(res));
            return response_1.ResponseHandler.success({ res, code: 200, message: "Notice updated successfully", data: updated });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    previewAudience: async (req, res) => {
        try {
            const result = await service_1.NoticeService.previewAudience(req.params.id);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Notice audience preview", data: result });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    publish: async (req, res) => {
        try {
            const notice = await service_1.NoticeService.publish(req.params.id, res.locals.context?.userId, getActor(res));
            return response_1.ResponseHandler.success({ res, code: 200, message: "Notice published", data: notice });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    unpublish: async (req, res) => {
        try {
            const notice = await service_1.NoticeService.unpublish(req.params.id, res.locals.context?.userId, getActor(res));
            return response_1.ResponseHandler.success({ res, code: 200, message: "Notice unpublished", data: notice });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            await service_1.NoticeService.delete(req.params.id, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Notice deleted successfully", data: null });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
