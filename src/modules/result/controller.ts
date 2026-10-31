import { Request, Response } from "express";
import { ResultService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateResultCreate, validateResultUpdate } from "./validator";

export const ResultController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const studentId = req.query.studentId as string | undefined;
      const status = req.query.status as string | undefined;
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await ResultService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
        studentId,
        status,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Results fetched successfully!",
        data: {
          data: result.results,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateResultCreate(req.body);
      const userId = res.locals.context?.userId;

      const result = await ResultService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Result created successfully",
        data: result,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const result = await ResultService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Result retrieved successfully",
        data: result,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateResultUpdate(req.body);
      const userId = res.locals.context?.userId;

      const result = await ResultService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Result updated successfully",
        data: result,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await ResultService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Result deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
