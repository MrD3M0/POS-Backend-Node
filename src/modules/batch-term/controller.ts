import { Request, Response } from "express";
import { BatchTermService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateBatchTermCreate, validateBatchTermUpdate } from "./validator";

export const BatchTermController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const batchId = req.query.batchId as string | undefined;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await BatchTermService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
        batchId,
        isActive,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "BatchTerms fetched successfully!",
        data: {
          data: result.batchTerms,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateBatchTermCreate(req.body);
      const userId = res.locals.context?.userId;

      const batchTerm = await BatchTermService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "BatchTerm created successfully",
        data: batchTerm,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const batchTerm = await BatchTermService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "BatchTerm retrieved successfully",
        data: batchTerm,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateBatchTermUpdate(req.body);
      const userId = res.locals.context?.userId;

      const batchTerm = await BatchTermService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "BatchTerm updated successfully",
        data: batchTerm,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await BatchTermService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "BatchTerm deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};