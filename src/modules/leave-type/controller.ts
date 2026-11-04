import { Request, Response } from "express";
import { LeaveTypeService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";

import { validateLeaveTypeCreate, validateLeaveTypeUpdate } from "./validator";

export const LeaveTypeController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await LeaveTypeService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Leave types fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateLeaveTypeCreate(req.body);
      const userId = res.locals.context?.userId;

      const leaveType = await LeaveTypeService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Leave type created successfully",
        data: leaveType,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const leaveType = await LeaveTypeService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Leave type retrieved successfully",
        data: leaveType,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await LeaveTypeService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Leave type deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
