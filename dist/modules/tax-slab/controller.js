"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaxSlabController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.TaxSlabController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const fiscalYearId = req.query.fiscalYearId;
            const isCouple = req.query.isCouple !== undefined ? req.query.isCouple === "true" : undefined;
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.TaxSlabService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
                fiscalYearId,
                isCouple,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Tax slabs fetched successfully!",
                data: {
                    data: result.taxSlabs,
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
            const validatedData = (0, validator_1.validateTaxSlabCreate)(req.body);
            const userId = res.locals.context?.userId;
            const taxSlab = await service_1.TaxSlabService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Tax slab created successfully",
                data: taxSlab,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const taxSlab = await service_1.TaxSlabService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Tax slab retrieved successfully",
                data: taxSlab,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const id = req.params.id;
            const validatedData = (0, validator_1.validateTaxSlabUpdate)(req.body);
            const userId = res.locals.context?.userId;
            const taxSlab = await service_1.TaxSlabService.update(id, validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Tax slab updated successfully",
                data: taxSlab,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    copy: async (req, res) => {
        try {
            const fromFiscalYearId = typeof req.body?.fromFiscalYearId === "string" ? req.body.fromFiscalYearId : "";
            const toFiscalYearId = typeof req.body?.toFiscalYearId === "string" ? req.body.toFiscalYearId : "";
            const result = await service_1.TaxSlabService.copy(fromFiscalYearId, toFiscalYearId, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Tax slabs copied", data: result });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            const id = req.params.id;
            const userId = res.locals.context?.userId;
            await service_1.TaxSlabService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Tax slab deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
