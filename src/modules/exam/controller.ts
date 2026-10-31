import { Request, Response } from "express";
import { ExamService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateExamCreate } from "./validator";

export const ExamController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await ExamService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Exams fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateExamCreate(req.body);
      const userId = res.locals.context?.userId;

      const exam = await ExamService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Exam created successfully",
        data: exam,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const exam = await ExamService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Exam retrieved successfully",
        data: exam,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await ExamService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Exam deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
