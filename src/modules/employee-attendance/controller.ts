import { Request, Response } from "express";
import { EmployeeAttendanceService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateEmployeeAttendanceCreate } from "./validator";

export const EmployeeAttendanceController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await EmployeeAttendanceService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Employee attendances fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateEmployeeAttendanceCreate(req.body);
      const userId = res.locals.context?.userId;

      const record = await EmployeeAttendanceService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Employee attendance record created successfully",
        data: record,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const record = await EmployeeAttendanceService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Employee attendance record retrieved successfully",
        data: record,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await EmployeeAttendanceService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Employee attendance record deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
