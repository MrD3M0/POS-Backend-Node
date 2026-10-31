import { Request, Response } from "express";

import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import {
  validateStudentStatusCreate,
  validateStudentStatusUpdate,
} from "./validator";
import { StudentStatusService } from "./service";

export const StudentStatusController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;
      const isActive =
        req.query.isActive !== undefined
          ? req.query.isActive === "true"
          : undefined;

      const result = await StudentStatusService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
        isActive,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Student statuses fetched successfully!",
        data: {
          data: result.data,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateStudentStatusCreate(req.body);
      const userId = res.locals.context?.userId;

      const item = await StudentStatusService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Student status created successfully",
        data: item,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const item = await StudentStatusService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Student status retrieved successfully",
        data: item,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateStudentStatusUpdate(req.body);
      const userId = res.locals.context?.userId;

      const item = await StudentStatusService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Student status updated successfully",
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

      await StudentStatusService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Student status deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
