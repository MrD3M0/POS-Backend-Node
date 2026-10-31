import { Request, Response } from "express";
import { ResultSubjectService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateResultSubjectCreate, validateResultSubjectUpdate } from "./validator";

export const ResultSubjectController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await ResultSubjectService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Result subjects fetched successfully!",
        data: {
          data: result.resultSubjects,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateResultSubjectCreate(req.body);
      const userId = res.locals.context?.userId;

      const resultSubject = await ResultSubjectService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Result subject created successfully",
        data: resultSubject,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const resultSubject = await ResultSubjectService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Result subject retrieved successfully",
        data: resultSubject,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateResultSubjectUpdate(req.body);
      const userId = res.locals.context?.userId;

      const resultSubject = await ResultSubjectService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Result subject updated successfully",
        data: resultSubject,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await ResultSubjectService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Result subject deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
