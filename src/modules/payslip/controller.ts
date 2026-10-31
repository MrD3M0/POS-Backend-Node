import { Request, Response } from "express";
import { PayslipService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validatePayslipCreate } from "./validator";

export const PayslipController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await PayslipService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Payslips fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validatePayslipCreate(req.body);
      const userId = res.locals.context?.userId;

      const slip = await PayslipService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Payslip created successfully",
        data: slip,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const slip = await PayslipService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Payslip retrieved successfully",
        data: slip,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await PayslipService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Payslip deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
