import { Request, Response } from "express";
import { NotificationService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { resolvePageLimit } from "@/utils/queryFilters";

export const NotificationController = {
  index: async (req: Request, res: Response) => {
    try {
      const limit = resolvePageLimit(req.query.limit, 10, 50);
      const feed = await NotificationService.getFeed(
        {
          userId: res.locals.context?.userId as string | undefined,
          role: res.locals.context?.role as string | undefined,
        },
        limit,
      );

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Notifications fetched successfully!",
        data: feed,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
