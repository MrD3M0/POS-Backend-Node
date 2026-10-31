import { Request, Response } from "express";
import { ExamTypeService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateExamTypeCreate } from "./validator";

export const ExamTypeController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await ExamTypeService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Exam types fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateExamTypeCreate(req.body);
      const userId = res.locals.context?.userId;

      const examType = await ExamTypeService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Exam type created successfully",
        data: examType,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const examType = await ExamTypeService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Exam type retrieved successfully",
        data: examType,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await ExamTypeService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Exam type deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
