import { Request, Response } from "express";
import { PeriodService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validatePeriodCreate, validatePeriodUpdate } from "./validator";

export const PeriodController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await PeriodService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
        isActive,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Periods fetched successfully!",
        data: {
          data: result.periods,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validatePeriodCreate(req.body);
      const userId = res.locals.context?.userId;

      const period = await PeriodService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Period created successfully",
        data: period,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const period = await PeriodService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Period retrieved successfully",
        data: period,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validatePeriodUpdate(req.body);
      const userId = res.locals.context?.userId;

      const period = await PeriodService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Period updated successfully",
        data: period,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await PeriodService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Period deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
