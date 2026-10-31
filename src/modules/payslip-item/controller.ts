import { Request, Response } from "express";
import { PayslipItemService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validatePayslipItemCreate } from "./validator";

export const PayslipItemController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await PayslipItemService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Payslip items fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validatePayslipItemCreate(req.body);
      const userId = res.locals.context?.userId;

      const item = await PayslipItemService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Payslip item created successfully",
        data: item,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const item = await PayslipItemService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Payslip item retrieved successfully",
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

      await PayslipItemService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Payslip item deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
