import { Request, Response } from "express";

import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import {
  validateAccountTypeCreate,
  validateAccountTypeUpdate,
} from "./validator";
import { AccountTypeService } from "./service";

export const AccountTypeController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await AccountTypeService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Account types fetched successfully!",
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
      const validatedData = validateAccountTypeCreate(req.body);
      const userId = res.locals.context?.userId;

      const item = await AccountTypeService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Account type created successfully",
        data: item,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const item = await AccountTypeService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Account type retrieved successfully",
        data: item,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateAccountTypeUpdate(req.body);
      const userId = res.locals.context?.userId;

      const item = await AccountTypeService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Account type updated successfully",
        data: item,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await AccountTypeService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Account type deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
