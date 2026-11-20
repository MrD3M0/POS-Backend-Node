import { Request, Response } from "express";
import { ResultService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateResultCreate, validateResultTransition, validateResultUpdate } from "./validator";

const getActor = (res: Response) => ({
  userId: res.locals.context?.userId as string | undefined,
  role: res.locals.context?.role as string | undefined,
});

const asString = (value: unknown) =>
  typeof value === "string" && value.length > 0 ? value : undefined;

export const ResultController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const result = await ResultService.index({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search,
        studentId: asString(req.query.studentId),
        examId: asString(req.query.examId),
        status: asString(req.query.status),
      });
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Results fetched successfully!",
        data: { data: result.results, pagination: result.pagination },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateResultCreate(req.body);
      const result = await ResultService.create(validatedData, getActor(res));
      return ResponseHandler.success({ res, code: 201, message: "Result created successfully", data: result });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const result = await ResultService.getById(req.params.id as string);
      return ResponseHandler.success({ res, code: 200, message: "Result retrieved successfully", data: result });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const validatedData = validateResultUpdate(req.body);
      const result = await ResultService.update(req.params.id as string, validatedData, getActor(res));
      return ResponseHandler.success({ res, code: 200, message: "Result updated successfully", data: result });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  transition: async (req: Request, res: Response) => {
    try {
      const validatedData = validateResultTransition(req.body);
      const result = await ResultService.transition(req.params.id as string, validatedData.to, getActor(res));
      return ResponseHandler.success({ res, code: 200, message: "Result transitioned successfully", data: result });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  recompute: async (req: Request, res: Response) => {
    try {
      const result = await ResultService.recompute(req.params.id as string, getActor(res));
      return ResponseHandler.success({ res, code: 200, message: "Result recomputed successfully", data: result });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  bulkApproveExam: async (req: Request, res: Response) => {
    try {
      const examId = req.params.examId as string;
      const summary = await ResultService.bulkApproveExam(examId, getActor(res));
      return ResponseHandler.success({ res, code: 200, message: "Bulk approve completed", data: summary });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await ResultService.delete(req.params.id as string, getActor(res));
      return ResponseHandler.success({ res, code: 200, message: "Result deleted successfully", data: null });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
