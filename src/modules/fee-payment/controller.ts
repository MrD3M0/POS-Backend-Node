import { Request, Response } from "express";
import { FeePaymentService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateFeePaymentCreate } from "./validator";

export const FeePaymentController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await FeePaymentService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Fee payments fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateFeePaymentCreate(req.body);
      const userId = res.locals.context?.userId;

      const payment = await FeePaymentService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Fee payment created successfully",
        data: payment,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const payment = await FeePaymentService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Fee payment retrieved successfully",
        data: payment,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await FeePaymentService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Fee payment deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
