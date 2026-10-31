import { Request, Response } from "express";
import { ExamSubjectService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateExamSubjectCreate } from "./validator";

export const ExamSubjectController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await ExamSubjectService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Exam subjects fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateExamSubjectCreate(req.body);
      const userId = res.locals.context?.userId;

      const item = await ExamSubjectService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Exam subject created successfully",
        data: item,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const item = await ExamSubjectService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Exam subject retrieved successfully",
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

      await ExamSubjectService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Exam subject deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
