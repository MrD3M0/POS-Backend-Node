import { Request, Response } from "express";
import { BatchService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateBatchCreate, validateBatchUpdate } from "./validator";

export const BatchController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const courseId = req.query.courseId as string | undefined;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await BatchService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
        courseId,
        isActive,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Batches fetched successfully!",
        data: {
          data: result.batches,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateBatchCreate(req.body);
      const userId = res.locals.context?.userId;

      const batch = await BatchService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Batch created successfully",
        data: batch,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const batch = await BatchService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Batch retrieved successfully",
        data: batch,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateBatchUpdate(req.body);
      const userId = res.locals.context?.userId;

      const batch = await BatchService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Batch updated successfully",
        data: batch,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await BatchService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Batch deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
