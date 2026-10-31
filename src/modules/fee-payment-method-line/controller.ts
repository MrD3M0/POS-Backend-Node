import { Request, Response } from "express";
import { FeePaymentMethodLineService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateFeePaymentMethodLineCreate } from "./validator";

export const FeePaymentMethodLineController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await FeePaymentMethodLineService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Fee payment method lines fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateFeePaymentMethodLineCreate(req.body);
      const userId = res.locals.context?.userId;

      const line = await FeePaymentMethodLineService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Fee payment method line created successfully",
        data: line,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const line = await FeePaymentMethodLineService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Fee payment method line retrieved successfully",
        data: line,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await FeePaymentMethodLineService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Fee payment method line deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
