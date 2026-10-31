import { Request, Response } from "express";
import { TeacherBatchPayService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateTeacherBatchPayCreate, validateTeacherBatchPayUpdate } from "./validator";

export const TeacherBatchPayController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const teachingAssignmentId = req.query.teachingAssignmentId as string | undefined;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await TeacherBatchPayService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
        teachingAssignmentId,
        isActive,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Teacher batch pays fetched successfully!",
        data: {
          data: result.pays,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateTeacherBatchPayCreate(req.body);
      const userId = res.locals.context?.userId;

      const pay = await TeacherBatchPayService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Teacher batch pay created successfully",
        data: pay,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const pay = await TeacherBatchPayService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Teacher batch pay retrieved successfully",
        data: pay,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateTeacherBatchPayUpdate(req.body);
      const userId = res.locals.context?.userId;

      const pay = await TeacherBatchPayService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Teacher batch pay updated successfully",
        data: pay,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await TeacherBatchPayService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Teacher batch pay deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};