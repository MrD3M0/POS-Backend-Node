import { Request, Response } from "express";
import { PaymentMethodService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validatePaymentMethodCreate, validatePaymentMethodUpdate } from "./validator";

export const PaymentMethodController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const result = await PaymentMethodService.index({ page: Number(page) || 1, limit: Number(limit) || 10, search });
      return ResponseHandler.success({ res, code: 200, message: "Payment methods fetched successfully!", data: result.data, pagination: result.pagination });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
  create: async (req: Request, res: Response) => {
    try {
      const paymentMethod = await PaymentMethodService.create(validatePaymentMethodCreate(req.body), res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 201, message: "Payment method created successfully", data: paymentMethod });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
  retrieve: async (req: Request, res: Response) => {
    try {
      const paymentMethod = await PaymentMethodService.getById(req.params.id as string);
      return ResponseHandler.success({ res, code: 200, message: "Payment method retrieved successfully", data: paymentMethod });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
  update: async (req: Request, res: Response) => {
    try {
      const paymentMethod = await PaymentMethodService.update(req.params.id as string, validatePaymentMethodUpdate(req.body), res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Payment method updated successfully", data: paymentMethod });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
  delete: async (req: Request, res: Response) => {
    try {
      await PaymentMethodService.delete(req.params.id as string, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Payment method deleted successfully", data: null });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
