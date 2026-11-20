import { Request, Response } from "express";
import { EmployeeAttendanceService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import {
  validateEmployeeAttendanceBulk,
  validateEmployeeAttendanceCreate,
  validateEmployeeAttendanceUpdate,
} from "./validator";

export const EmployeeAttendanceController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const result = await EmployeeAttendanceService.index({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search,
        status: req.query.status as string | undefined,
        employeeId: req.query.employeeId as string | undefined,
        dateBs: req.query.dateBs as string | undefined,
        yearBs: req.query.yearBs ? Number(req.query.yearBs) : undefined,
        monthBs: req.query.monthBs ? Number(req.query.monthBs) : undefined,
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
      const record = await EmployeeAttendanceService.create(
        validateEmployeeAttendanceCreate(req.body),
        res.locals.context?.userId,
        res.locals.context?.role,
      );
      return ResponseHandler.success({ res, code: 201, message: "Employee attendance created", data: record });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  bulkMark: async (req: Request, res: Response) => {
    try {
      const result = await EmployeeAttendanceService.bulkMark(
        validateEmployeeAttendanceBulk(req.body),
        res.locals.context?.userId,
        res.locals.context?.role,
      );
      return ResponseHandler.success({ res, code: 200, message: "Bulk attendance marked", data: result });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const record = await EmployeeAttendanceService.getById(req.params.id as string);
      return ResponseHandler.success({ res, code: 200, message: "Employee attendance retrieved", data: record });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const record = await EmployeeAttendanceService.update(
        req.params.id as string,
        validateEmployeeAttendanceUpdate(req.body),
        res.locals.context?.userId,
        res.locals.context?.role,
      );
      return ResponseHandler.success({ res, code: 200, message: "Employee attendance updated", data: record });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await EmployeeAttendanceService.delete(
        req.params.id as string,
        res.locals.context?.userId,
        res.locals.context?.role,
      );
      return ResponseHandler.success({ res, code: 200, message: "Employee attendance deleted", data: null });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
