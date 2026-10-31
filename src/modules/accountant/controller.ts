import { Request, Response } from "express";
import { AccountantService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateAccountantCreate } from "./validator";

export const AccountantController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await AccountantService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Accountants fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateAccountantCreate(req.body);
      const userId = res.locals.context?.userId;

      const accountant = await AccountantService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Accountant created successfully",
        data: accountant,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const accountant = await AccountantService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Accountant retrieved successfully",
        data: accountant,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await AccountantService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Accountant deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
