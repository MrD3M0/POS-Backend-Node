import { Request, Response } from "express";
import { ExamMarkService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateExamMarkCreate } from "./validator";

export const ExamMarkController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await ExamMarkService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Exam marks fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateExamMarkCreate(req.body);
      const userId = res.locals.context?.userId;

      const mark = await ExamMarkService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Exam mark created successfully",
        data: mark,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const mark = await ExamMarkService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Exam mark retrieved successfully",
        data: mark,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await ExamMarkService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Exam mark deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
