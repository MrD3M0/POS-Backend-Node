import { Request, Response } from "express";
import { FeePaymentAllocationService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateFeePaymentAllocationCreate } from "./validator";

export const FeePaymentAllocationController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await FeePaymentAllocationService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Fee payment allocations fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateFeePaymentAllocationCreate(req.body);
      const userId = res.locals.context?.userId;

      const allocation = await FeePaymentAllocationService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Fee payment allocation created successfully",
        data: allocation,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const allocation = await FeePaymentAllocationService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Fee payment allocation retrieved successfully",
        data: allocation,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await FeePaymentAllocationService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Fee payment allocation deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
