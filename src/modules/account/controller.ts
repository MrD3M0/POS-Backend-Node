import { Request, Response } from "express";
import { AccountService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateAccountCreate } from "./validator";

export const AccountController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await AccountService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Accounts fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateAccountCreate(req.body);
      const userId = res.locals.context?.userId;

      const account = await AccountService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Account created successfully",
        data: account,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const account = await AccountService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Account retrieved successfully",
        data: account,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await AccountService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Account deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
