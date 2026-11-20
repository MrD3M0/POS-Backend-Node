import { Request, Response } from "express";
import { PayslipService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validatePayslipCreate, validatePayslipUpdate } from "./validator";

export const PayslipController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const result = await PayslipService.index({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search,
        payrollId: req.query.payrollId as string | undefined,
        employeeId: req.query.employeeId as string | undefined,
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
      const slip = await PayslipService.create(validatePayslipCreate(req.body), res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 201, message: "Payslip created successfully", data: slip });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const slip = await PayslipService.getById(req.params.id as string);
      return ResponseHandler.success({ res, code: 200, message: "Payslip retrieved successfully", data: slip });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const slip = await PayslipService.update(
        req.params.id as string,
        validatePayslipUpdate(req.body),
        res.locals.context?.userId,
      );
      return ResponseHandler.success({ res, code: 200, message: "Payslip updated successfully", data: slip });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await PayslipService.delete(req.params.id as string, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Payslip deleted successfully", data: null });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
