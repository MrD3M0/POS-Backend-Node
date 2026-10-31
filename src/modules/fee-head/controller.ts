import { Request, Response } from "express";
import { FeeHeadService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateFeeHeadCreate } from "./validator";

export const FeeHeadController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await FeeHeadService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Fee heads fetched successfully!",
        data: {
          data: result.data,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateFeeHeadCreate(req.body);
      const userId = res.locals.context?.userId;

      const head = await FeeHeadService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Fee head created successfully",
        data: head,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const head = await FeeHeadService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Fee head retrieved successfully",
        data: head,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await FeeHeadService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Fee head deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
