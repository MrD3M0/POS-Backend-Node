import { Request, Response } from "express";
import { PayrollService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validatePayrollCreate } from "./validator";

export const PayrollController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await PayrollService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Payroll fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validatePayrollCreate(req.body);
      const userId = res.locals.context?.userId;

      const record = await PayrollService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Payroll created successfully",
        data: record,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const record = await PayrollService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Payrol retrieved successfully",
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

      await PayrollService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Payroll deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
