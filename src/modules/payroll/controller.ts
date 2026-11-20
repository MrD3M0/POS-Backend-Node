import { Request, Response } from "express";
import { PayrollService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validatePayrollCreate, validatePayrollPay, validatePayrollUpdate } from "./validator";

export const PayrollController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const result = await PayrollService.index({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search,
        status: req.query.status as string | undefined,
        fiscalYearId: req.query.fiscalYearId as string | undefined,
        yearBs: req.query.yearBs ? Number(req.query.yearBs) : undefined,
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
      const record = await PayrollService.create(validatePayrollCreate(req.body), res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 201, message: "Payroll created (payslips generated)", data: record });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const record = await PayrollService.getById(req.params.id as string);
      return ResponseHandler.success({ res, code: 200, message: "Payroll retrieved successfully", data: record });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const record = await PayrollService.update(
        req.params.id as string,
        validatePayrollUpdate(req.body),
        res.locals.context?.userId,
      );
      return ResponseHandler.success({ res, code: 200, message: "Payroll updated successfully", data: record });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  regenerate: async (req: Request, res: Response) => {
    try {
      const record = await PayrollService.regenerate(req.params.id as string, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Payslips regenerated", data: record });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  submit: async (req: Request, res: Response) => {
    try {
      const record = await PayrollService.submit(req.params.id as string, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Payroll submitted for approval", data: record });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  approve: async (req: Request, res: Response) => {
    try {
      const record = await PayrollService.approve(req.params.id as string, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Payroll approved (attendance locked)", data: record });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  reject: async (req: Request, res: Response) => {
    try {
      const record = await PayrollService.reject(req.params.id as string, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Payroll rejected", data: record });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  backToDraft: async (req: Request, res: Response) => {
    try {
      const record = await PayrollService.backToDraft(req.params.id as string, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Payroll returned to DRAFT", data: record });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  pay: async (req: Request, res: Response) => {
    try {
      const { paidDateBs } = validatePayrollPay(req.body);
      const record = await PayrollService.pay(req.params.id as string, paidDateBs, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Payroll paid (journal posted)", data: record });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await PayrollService.delete(req.params.id as string, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Payroll deleted successfully", data: null });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
