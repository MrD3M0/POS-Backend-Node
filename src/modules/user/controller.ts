import { Request, Response } from "express";

import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import {
  validateUserCreate,
  validateUserResetPassword,
  validateUserUpdate,
} from "./validator";
import { UserService } from "./service";

export const UserController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;
      const role =
        typeof req.query.role === "string" ? req.query.role : undefined;
      const isActive =
        req.query.isActive !== undefined
          ? req.query.isActive === "true"
          : undefined;

      const result = await UserService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
        role,
        isActive,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Users fetched successfully!",
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
      const validatedData = validateUserCreate(req.body);
      const userId = res.locals.context?.userId;

      const user = await UserService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "User created successfully",
        data: user,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const user = await UserService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "User retrieved successfully",
        data: user,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateUserUpdate(req.body);
      const userId = res.locals.context?.userId;

      const user = await UserService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "User updated successfully",
        data: user,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateUserResetPassword(req.body);
      const userId = res.locals.context?.userId;

      await UserService.resetPassword(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Password reset successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  unlock: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      const user = await UserService.unlock(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "User unlocked successfully",
        data: user,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await UserService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "User deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
