import { Request, Response } from "express";
import { CourseService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateCourseCreate, validateCourseUpdate } from "./validator";

export const CourseController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await CourseService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
        isActive,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Courses fetched successfully!",
        data: {
          data: result.courses,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateCourseCreate(req.body);
      const userId = res.locals.context?.userId;

      const course = await CourseService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Course created successfully",
        data: course,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const course = await CourseService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Course retrieved successfully",
        data: course,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateCourseUpdate(req.body);
      const userId = res.locals.context?.userId;

      const course = await CourseService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Course updated successfully",
        data: course,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await CourseService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Course deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
