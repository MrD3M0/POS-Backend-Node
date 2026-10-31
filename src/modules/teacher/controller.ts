import { Request, Response } from "express";
import { TeacherService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateTeacherCreate } from "./validator";

export const TeacherController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await TeacherService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Teachers fetched successfully!",
        data: {
          data: result.teachers,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateTeacherCreate(req.body);
      const userId = res.locals.context?.userId;

      const teacher = await TeacherService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Teacher created successfully",
        data: teacher,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const teacher = await TeacherService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Teacher retrieved successfully",
        data: teacher,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await TeacherService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Teacher deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};