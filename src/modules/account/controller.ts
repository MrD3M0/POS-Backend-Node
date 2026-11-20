import { Request, Response } from "express";
import { AccountService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateAccountCreate, validateAccountUpdate } from "./validator";

export const AccountController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const result = await AccountService.index({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search,
        type: req.query.type as string | undefined,
        includeDeleted: req.query.includeDeleted === "true",
      });
      return ResponseHandler.success({ res, code: 200, message: "Accounts fetched successfully!", data: result.data, pagination: result.pagination });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  tree: async (_req: Request, res: Response) => {
    try {
      const data = await AccountService.tree();
      return ResponseHandler.success({ res, code: 200, message: "Chart of accounts fetched", data });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  seedDefault: async (req: Request, res: Response) => {
    try {
      const result = await AccountService.seedDefault(res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Default chart of accounts seeded", data: result });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const account = await AccountService.create(validateAccountCreate(req.body), res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 201, message: "Account created successfully", data: account });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const account = await AccountService.getById(req.params.id as string);
      return ResponseHandler.success({ res, code: 200, message: "Account retrieved successfully", data: account });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const account = await AccountService.update(
        req.params.id as string,
        validateAccountUpdate(req.body),
        res.locals.context?.userId,
      );
      return ResponseHandler.success({ res, code: 200, message: "Account updated successfully", data: account });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await AccountService.delete(req.params.id as string, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Account deactivated successfully", data: null });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
