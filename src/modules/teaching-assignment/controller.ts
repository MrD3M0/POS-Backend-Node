import { Request, Response } from "express";
import { TeachingAssignmentService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateTeachingAssignmentCreate } from "./validator";

export const TeachingAssignmentController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await TeachingAssignmentService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Teaching assignments fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateTeachingAssignmentCreate(req.body);
      const userId = res.locals.context?.userId;

      const assignment = await TeachingAssignmentService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Teaching assignment created successfully",
        data: assignment,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const assignment = await TeachingAssignmentService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Teaching assignment retrieved successfully",
        data: assignment,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await TeachingAssignmentService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Teaching assignment deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
