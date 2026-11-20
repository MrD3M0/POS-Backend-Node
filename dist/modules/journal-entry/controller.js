"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalEntryController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.JournalEntryController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.JournalEntryService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Journal entries fetched successfully!",
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
            const validatedData = (0, validator_1.validateJournalEntryCreate)(req.body);
            const userId = res.locals.context?.userId;
            const entry = await service_1.JournalEntryService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Journal entry created successfully",
                data: entry,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const entry = await service_1.JournalEntryService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Journal entry retrieved successfully",
                data: entry,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    reverse: async (req, res) => {
        try {
            const id = req.params.id;
            const validatedData = (0, validator_1.validateJournalEntryReverse)(req.body);
            const userId = res.locals.context?.userId;
            const reversal = await service_1.JournalEntryService.reverse(id, validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Journal entry reversed successfully",
                data: reversal,
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
            await service_1.JournalEntryService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Journal entry deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
