import { Request, Response } from "express";

import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import {
  validateAttendanceStatusCreate,
  validateAttendanceStatusUpdate,
} from "./validator";
import { AttendanceStatusService } from "./service";

export const AttendanceStatusController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;
      const isActive =
        req.query.isActive !== undefined
          ? req.query.isActive === "true"
          : undefined;

      const result = await AttendanceStatusService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
        isActive,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Attendance statuses fetched successfully!",
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
      const validatedData = validateAttendanceStatusCreate(req.body);
      const userId = res.locals.context?.userId;

      const item = await AttendanceStatusService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Attendance status created successfully",
        data: item,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const item = await AttendanceStatusService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Attendance status retrieved successfully",
        data: item,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateAttendanceStatusUpdate(req.body);
      const userId = res.locals.context?.userId;

      const item = await AttendanceStatusService.update(
        id,
        validatedData,
        userId,
      );

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Attendance status updated successfully",
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

      await AttendanceStatusService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Attendance status deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
