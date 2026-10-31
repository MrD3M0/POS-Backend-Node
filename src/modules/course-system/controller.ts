import { Request, Response } from "express";

import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import {
  validateCourseSystemCreate,
  validateCourseSystemUpdate,
} from "./validator";
import { CourseSystemService } from "./service";

export const CourseSystemController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;
      const isActive =
        req.query.isActive !== undefined
          ? req.query.isActive === "true"
          : undefined;

      const result = await CourseSystemService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
        isActive,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Course systems fetched successfully!",
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
      const validatedData = validateCourseSystemCreate(req.body);
      const userId = res.locals.context?.userId;

      const item = await CourseSystemService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Course system created successfully",
        data: item,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const item = await CourseSystemService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Course system retrieved successfully",
        data: item,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateCourseSystemUpdate(req.body);
      const userId = res.locals.context?.userId;

      const item = await CourseSystemService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Course system updated successfully",
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

      await CourseSystemService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Course system deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
