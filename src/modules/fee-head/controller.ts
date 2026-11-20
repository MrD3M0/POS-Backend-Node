import { Request, Response } from "express";
import { FeeHeadService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateFeeHeadCreate, validateFeeHeadUpdate } from "./validator";

export const FeeHeadController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const result = await FeeHeadService.index({ page: Number(page) || 1, limit: Number(limit) || 10, search });
      return ResponseHandler.success({ res, code: 200, message: "Fee heads fetched successfully!", data: { data: result.data, pagination: result.pagination } });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
  create: async (req: Request, res: Response) => {
    try {
      const head = await FeeHeadService.create(validateFeeHeadCreate(req.body), res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 201, message: "Fee head created successfully", data: head });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
  retrieve: async (req: Request, res: Response) => {
    try {
      const head = await FeeHeadService.getById(req.params.id as string);
      return ResponseHandler.success({ res, code: 200, message: "Fee head retrieved successfully", data: head });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
  update: async (req: Request, res: Response) => {
    try {
      const head = await FeeHeadService.update(req.params.id as string, validateFeeHeadUpdate(req.body), res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Fee head updated successfully", data: head });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
  delete: async (req: Request, res: Response) => {
    try {
      await FeeHeadService.delete(req.params.id as string, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Fee head deleted successfully", data: null });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
