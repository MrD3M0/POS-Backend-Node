import { Request, Response } from "express";
import { BatchTermSubjectService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateBatchTermSubjectBulkCreate, validateBatchTermSubjectCreate, validateBatchTermSubjectUpdate } from "./validator";

export const BatchTermSubjectController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const batchTermId = req.query.batchTermId as string | undefined;
      const subjectId = req.query.subjectId as string | undefined;
      const isElective = req.query.isElective !== undefined ? req.query.isElective === "true" : undefined;
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await BatchTermSubjectService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
        batchTermId,
        subjectId,
        isElective,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "BatchTermSubjects fetched successfully!",
        data: {
          data: result.batchTermSubjects,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateBatchTermSubjectCreate(req.body);
      const userId = res.locals.context?.userId;

      const batchTermSubject = await BatchTermSubjectService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "BatchTermSubject created successfully",
        data: batchTermSubject,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  bulkCreate: async (req: Request, res: Response) => {
    try {
      const validatedData = validateBatchTermSubjectBulkCreate(req.body);
      const userId = res.locals.context?.userId;

      const result = await BatchTermSubjectService.bulkCreate(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: `${result.created} subject${result.created > 1 ? "s" : ""} assigned successfully`,
        data: result,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const batchTermSubject = await BatchTermSubjectService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "BatchTermSubject retrieved successfully",
        data: batchTermSubject,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateBatchTermSubjectUpdate(req.body);
      const userId = res.locals.context?.userId;

      const batchTermSubject = await BatchTermSubjectService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "BatchTermSubject updated successfully",
        data: batchTermSubject,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  copy: async (req: Request, res: Response) => {
    try {
      const fromBatchTermId = typeof req.body?.fromBatchTermId === "string" ? req.body.fromBatchTermId : "";
      const toBatchTermId = typeof req.body?.toBatchTermId === "string" ? req.body.toBatchTermId : "";
      const result = await BatchTermSubjectService.copy(fromBatchTermId, toBatchTermId, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Syllabus copied", data: result });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await BatchTermSubjectService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "BatchTermSubject deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};