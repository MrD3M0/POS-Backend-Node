import { Request, Response } from "express";
import { StaffService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateStaffCreate } from "./validator";

export const StaffController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await StaffService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Staff fetched successfully!",
        data: {
          data: result.staffs,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateStaffCreate(req.body);
      const userId = res.locals.context?.userId;

      const staff = await StaffService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Staff created successfully",
        data: staff,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const staff = await StaffService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Staff retrieved successfully",
        data: staff,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await StaffService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Staff deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};