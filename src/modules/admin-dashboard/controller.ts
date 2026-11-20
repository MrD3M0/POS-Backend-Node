import { Request, Response } from "express";
import { AdminDashboardService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";

export const AdminDashboardController = {
  overview: async (_req: Request, res: Response) => {
    try {
      const data = await AdminDashboardService.overview();
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Dashboard fetched successfully",
        data,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  health: async (_req: Request, res: Response) => {
    try {
      const data = await AdminDashboardService.healthChecks();
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Health checks fetched successfully",
        data,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
