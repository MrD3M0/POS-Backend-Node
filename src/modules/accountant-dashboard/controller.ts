import { Request, Response } from "express";
import { AccountantDashboardService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";

/**
 * One endpoint per dashboard section, so the frontend can give every card
 * its own loading / empty / error state (a failing section never blocks the
 * others).
 */
export const AccountantDashboardController = {
  kpis: async (_req: Request, res: Response) => {
    try {
      const data = await AccountantDashboardService.kpis();
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Accountant dashboard KPIs fetched successfully!",
        data,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  feeAnalytics: async (_req: Request, res: Response) => {
    try {
      const data = await AccountantDashboardService.feeAnalytics();
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Fee analytics fetched successfully!",
        data,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  collections: async (_req: Request, res: Response) => {
    try {
      const data = await AccountantDashboardService.collections();
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Collections fetched successfully!",
        data,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  journal: async (_req: Request, res: Response) => {
    try {
      const data = await AccountantDashboardService.journal();
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Journal summary fetched successfully!",
        data,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  payrollAndAlerts: async (_req: Request, res: Response) => {
    try {
      const data = await AccountantDashboardService.payrollAndAlerts();
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Payroll summary and alerts fetched successfully!",
        data,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
