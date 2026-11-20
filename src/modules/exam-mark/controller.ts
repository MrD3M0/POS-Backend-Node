import { Request, Response } from "express";
import { ExamMarkService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateExamMarkBulk, validateExamMarkCreate, validateExamMarkUpdate } from "./validator";

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
        examSubjectId: (req.query.examSubjectId as string | undefined) || undefined,
        studentId: (req.query.studentId as string | undefined) || undefined,
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

  bulkCreate: async (req: Request, res: Response) => {
    try {
      const validatedData = validateExamMarkBulk(req.body);
      const userId = res.locals.context?.userId;

      const marks = await ExamMarkService.bulkCreate(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Exam marks created successfully",
        data: marks,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateExamMarkUpdate(req.body);
      const userId = res.locals.context?.userId;

      const mark = await ExamMarkService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Exam mark updated successfully",
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
