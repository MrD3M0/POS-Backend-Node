import { Request, Response } from "express";
import { NoticeService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateNoticeCreate } from "./validator";

export const NoticeController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await NoticeService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Notices fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateNoticeCreate(req.body);
      const userId = res.locals.context?.userId;

      const notice = await NoticeService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Notice created successfully",
        data: notice,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const notice = await NoticeService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Notice retrieved successfully",
        data: notice,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await NoticeService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Notice deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
