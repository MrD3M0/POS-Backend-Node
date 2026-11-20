import { Request, Response } from "express";
import { ExamTypeService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateExamTypeCreate, validateExamTypeUpdate } from "./validator";

export const ExamTypeController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const result = await ExamTypeService.index({ page: Number(page) || 1, limit: Number(limit) || 10, search });
      return ResponseHandler.success({ res, code: 200, message: "Exam types fetched successfully!", data: result.data, pagination: result.pagination });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
  create: async (req: Request, res: Response) => {
    try {
      const examType = await ExamTypeService.create(validateExamTypeCreate(req.body), res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 201, message: "Exam type created successfully", data: examType });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
  retrieve: async (req: Request, res: Response) => {
    try {
      const examType = await ExamTypeService.getById(req.params.id as string);
      return ResponseHandler.success({ res, code: 200, message: "Exam type retrieved successfully", data: examType });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
  update: async (req: Request, res: Response) => {
    try {
      const examType = await ExamTypeService.update(req.params.id as string, validateExamTypeUpdate(req.body), res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Exam type updated successfully", data: examType });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
  delete: async (req: Request, res: Response) => {
    try {
      await ExamTypeService.delete(req.params.id as string, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Exam type deleted successfully", data: null });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
