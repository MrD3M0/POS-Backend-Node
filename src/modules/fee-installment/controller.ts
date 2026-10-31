import { Request, Response } from "express";
import { FeeInstallmentService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateFeeInstallmentCreate } from "./validator";

export const FeeInstallmentController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await FeeInstallmentService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Fee installments fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateFeeInstallmentCreate(req.body);
      const userId = res.locals.context?.userId;

      const installment = await FeeInstallmentService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Fee installment created successfully",
        data: installment,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const installment = await FeeInstallmentService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Fee installment retrieved successfully",
        data: installment,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await FeeInstallmentService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Fee installment deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
