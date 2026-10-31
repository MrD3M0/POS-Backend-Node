import { Request, Response } from "express";
import { PaymentMethodService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validatePaymentMethodCreate } from "./validator";

export const PaymentMethodController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await PaymentMethodService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Payment methods fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validatePaymentMethodCreate(req.body);
      const userId = res.locals.context?.userId;

      const paymentMethod = await PaymentMethodService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Payment method created successfully",
        data: paymentMethod,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const paymentMethod = await PaymentMethodService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Payment method retrieved successfully",
        data: paymentMethod,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await PaymentMethodService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Payment method deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
