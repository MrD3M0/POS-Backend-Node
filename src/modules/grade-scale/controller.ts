import { Request, Response } from "express";
import { GradeScaleService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateGradeScaleItemCreate } from "./validator";

export const GradeScaleController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await GradeScaleService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
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
      const validatedData = validateGradeScaleItemCreate(req.body);
      const userId = res.locals.context?.userId;

      const item = await GradeScaleService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Grade scale item created successfully",
        data: item,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const item = await GradeScaleService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Grade scale item retrieved successfully",
        data: item,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await GradeScaleService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Grade scale item deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
