import { Request, Response } from "express";
import { AttendanceSessionService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateAttendanceSessionCreate } from "./validator";

export const AttendanceSessionController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await AttendanceSessionService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Attendance sessions fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateAttendanceSessionCreate(req.body);
      const userId = res.locals.context?.userId;

      const session = await AttendanceSessionService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Attendance session created successfully",
        data: session,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const session = await AttendanceSessionService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Attendance session retrieved successfully",
        data: session,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await AttendanceSessionService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Attendance session deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
