import { Request, Response } from "express";
import { ExamSubjectService } from "./service";
import { ExamSubjectWorkflow } from "./workflow";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import {
  validateExamSubjectCreate,
  validateExamSubjectReview,
  validateExamSubjectUpdate,
  validateResultPublish,
} from "./validator";

const getActor = (res: Response) => ({
  userId: res.locals.context?.userId as string | undefined,
  role: res.locals.context?.role as string | undefined,
});

const asString = (value: unknown) =>
  typeof value === "string" && value.length > 0 ? value : undefined;

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

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateExamSubjectUpdate(req.body);
      const userId = res.locals.context?.userId;

      const item = await ExamSubjectService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Exam subject updated successfully",
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

  // ── Group-level result workflow ──────────────────────────────────────

  groups: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const result = await ExamSubjectWorkflow.groups(
        {
          page: Number(page) || 1,
          limit: Number(limit) || 20,
          search,
          batchId: asString(req.query.batchId),
          termId: asString(req.query.termId),
          subjectId: asString(req.query.subjectId),
          examId: asString(req.query.examId),
          status: asString(req.query.status),
        },
        getActor(res),
      );
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Result groups fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  submit: async (req: Request, res: Response) => {
    try {
      const item = await ExamSubjectWorkflow.submit(
        req.params.id as string,
        getActor(res),
      );
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Marks submitted for approval",
        data: item,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  bulkReview: async (req: Request, res: Response) => {
    try {
      const input = validateExamSubjectReview(req.body);
      const summary = await ExamSubjectWorkflow.bulkReview(input, getActor(res));
      return ResponseHandler.success({
        res,
        code: 200,
        message:
          input.action === "APPROVE"
            ? "Subjects approved"
            : "Subjects rejected",
        data: summary,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  publish: async (req: Request, res: Response) => {
    try {
      const input = validateResultPublish(req.body);
      const summary = await ExamSubjectWorkflow.publish(input, getActor(res));
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Results published",
        data: summary,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
