import { Request, Response } from "express";
import { FiscalYearService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateFiscalYearCreate, validateFiscalYearUpdate } from "./validator";

export const FiscalYearController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const result = await FiscalYearService.index({ page: Number(page) || 1, limit: Number(limit) || 10, search });
      return ResponseHandler.success({ res, code: 200, message: "Fiscal years fetched successfully!", data: result.data, pagination: result.pagination });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const year = await FiscalYearService.create(validateFiscalYearCreate(req.body), res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 201, message: "Fiscal year created successfully", data: year });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const year = await FiscalYearService.getById(req.params.id as string);
      return ResponseHandler.success({ res, code: 200, message: "Fiscal year retrieved successfully", data: year });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const year = await FiscalYearService.update(
        req.params.id as string,
        validateFiscalYearUpdate(req.body),
        res.locals.context?.userId,
      );
      return ResponseHandler.success({ res, code: 200, message: "Fiscal year updated successfully", data: year });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  setCurrent: async (req: Request, res: Response) => {
    try {
      const year = await FiscalYearService.setCurrent(req.params.id as string, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Current fiscal year updated", data: year });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  closePreview: async (req: Request, res: Response) => {
    try {
      const preview = await FiscalYearService.closePreview(req.params.id as string);
      return ResponseHandler.success({ res, code: 200, message: "Fiscal year close preview", data: preview });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  close: async (req: Request, res: Response) => {
    try {
      const reason = typeof req.body?.reason === "string" ? req.body.reason : "";
      const result = await FiscalYearService.close(req.params.id as string, reason, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Fiscal year closed", data: result });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await FiscalYearService.delete(req.params.id as string, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Fiscal year deleted successfully", data: null });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
