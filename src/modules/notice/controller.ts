import { Request, Response } from "express";
import { NoticeService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateNoticeCreate, validateNoticeUpdate } from "./validator";

const getActor = (res: Response) => ({
  userId: res.locals.context?.userId as string | undefined,
  role: res.locals.context?.role as string | undefined,
});

export const NoticeController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const showDrafts = req.query.showDrafts === "true" || req.query.showDrafts === "1";
      const result = await NoticeService.index(
        { page: Number(page) || 1, limit: Number(limit) || 10, search, showDrafts },
        getActor(res),
      );
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
      const notice = await NoticeService.create(
        validatedData,
        res.locals.context?.userId,
        getActor(res),
      );
      return ResponseHandler.success({ res, code: 201, message: "Notice created successfully", data: notice });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const notice = await NoticeService.getById(req.params.id as string, getActor(res));
      return ResponseHandler.success({ res, code: 200, message: "Notice retrieved successfully", data: notice });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const validatedData = validateNoticeUpdate(req.body);
      const updated = await NoticeService.update(
        req.params.id as string,
        validatedData,
        res.locals.context?.userId,
        getActor(res),
      );
      return ResponseHandler.success({ res, code: 200, message: "Notice updated successfully", data: updated });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  previewAudience: async (req: Request, res: Response) => {
    try {
      const result = await NoticeService.previewAudience(req.params.id as string);
      return ResponseHandler.success({ res, code: 200, message: "Notice audience preview", data: result });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  publish: async (req: Request, res: Response) => {
    try {
      const notice = await NoticeService.publish(
        req.params.id as string,
        res.locals.context?.userId,
        getActor(res),
      );
      return ResponseHandler.success({ res, code: 200, message: "Notice published", data: notice });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  unpublish: async (req: Request, res: Response) => {
    try {
      const notice = await NoticeService.unpublish(
        req.params.id as string,
        res.locals.context?.userId,
        getActor(res),
      );
      return ResponseHandler.success({ res, code: 200, message: "Notice unpublished", data: notice });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await NoticeService.delete(req.params.id as string, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Notice deleted successfully", data: null });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
