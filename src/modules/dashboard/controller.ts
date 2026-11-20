import { Request, Response } from "express";
import { DashboardService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";

const getActor = (res: Response) => ({
  userId: res.locals.context?.userId as string | undefined,
  role: res.locals.context?.role as string | undefined,
});

export const DashboardController = {
  admin: async (_req: Request, res: Response) => {
    try {
      const data = await DashboardService.admin();
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Admin dashboard fetched successfully!",
        data,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  principal: async (_req: Request, res: Response) => {
    try {
      const data = await DashboardService.principal(getActor(res));
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Principal dashboard fetched successfully!",
        data,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  accountant: async (_req: Request, res: Response) => {
    try {
      const data = await DashboardService.accountant();
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Accountant dashboard fetched successfully!",
        data,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  teacher: async (_req: Request, res: Response) => {
    try {
      const data = await DashboardService.teacher(getActor(res));
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Teacher dashboard fetched successfully!",
        data,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  staff: async (_req: Request, res: Response) => {
    try {
      const data = await DashboardService.staff(getActor(res));
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Staff dashboard fetched successfully!",
        data,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
