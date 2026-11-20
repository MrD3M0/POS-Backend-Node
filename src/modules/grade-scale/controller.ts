import { Request, Response } from "express";
import { GradeScaleService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateGradeScaleItemCreate, validateGradeScaleItemUpdate } from "./validator";

export const GradeScaleController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const result = await GradeScaleService.index({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search,
        includeDeleted: req.query.includeDeleted === "true",
      });
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Grade scale items fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const item = await GradeScaleService.create(
        validateGradeScaleItemCreate(req.body),
        res.locals.context?.userId,
      );
      return ResponseHandler.success({ res, code: 201, message: "Grade scale item created successfully", data: item });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  seedDefault: async (req: Request, res: Response) => {
    try {
      const result = await GradeScaleService.seedDefault(res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Default grade scale seeded", data: result });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  coverage: async (_req: Request, res: Response) => {
    try {
      const result = await GradeScaleService.coverage();
      return ResponseHandler.success({ res, code: 200, message: "Grade scale coverage", data: result });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const item = await GradeScaleService.getById(req.params.id as string);
      return ResponseHandler.success({ res, code: 200, message: "Grade scale item retrieved successfully", data: item });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const item = await GradeScaleService.update(
        req.params.id as string,
        validateGradeScaleItemUpdate(req.body),
        res.locals.context?.userId,
      );
      return ResponseHandler.success({ res, code: 200, message: "Grade scale item updated successfully", data: item });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await GradeScaleService.delete(req.params.id as string, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Grade scale item deleted successfully", data: null });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
