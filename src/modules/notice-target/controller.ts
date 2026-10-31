import { Request, Response } from "express";
import { NoticeTargetService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateNoticeTargetCreate } from "./validator";

export const NoticeTargetController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await NoticeTargetService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Notice targets fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateNoticeTargetCreate(req.body);
      const userId = res.locals.context?.userId;

      const target = await NoticeTargetService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Notice target created successfully",
        data: target,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const target = await NoticeTargetService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Notice target retrieved successfully",
        data: target,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await NoticeTargetService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Notice target deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
