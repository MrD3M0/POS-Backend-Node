import { Request, Response } from "express";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import {
  validateUserCreate,
  validateUserLinkPerson,
  validateUserResetPassword,
  validateUserUpdate,
  validateUserVerifyEmail,
} from "./validator";
import { UserService } from "./service";

export const UserController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const result = await UserService.index({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search,
        role: typeof req.query.role === "string" ? req.query.role : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === "true" : undefined,
        isLocked: req.query.isLocked !== undefined ? req.query.isLocked === "true" : undefined,
        isEmailVerified:
          req.query.isEmailVerified !== undefined ? req.query.isEmailVerified === "true" : undefined,
        includeDeleted: req.query.includeDeleted === "true",
      });
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Users fetched successfully!",
        data: { data: result.data, pagination: result.pagination },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const user = await UserService.create(validateUserCreate(req.body), res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 201, message: "User created successfully", data: user });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const user = await UserService.getById(req.params.id as string);
      return ResponseHandler.success({ res, code: 200, message: "User retrieved successfully", data: user });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const user = await UserService.update(
        req.params.id as string,
        validateUserUpdate(req.body),
        res.locals.context?.userId,
      );
      return ResponseHandler.success({ res, code: 200, message: "User updated successfully", data: user });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      await UserService.resetPassword(
        req.params.id as string,
        validateUserResetPassword(req.body),
        res.locals.context?.userId,
      );
      return ResponseHandler.success({ res, code: 200, message: "Password reset successfully", data: null });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  unlock: async (req: Request, res: Response) => {
    try {
      const user = await UserService.unlock(req.params.id as string, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "User unlocked successfully", data: user });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  linkPerson: async (req: Request, res: Response) => {
    try {
      const user = await UserService.linkPerson(
        req.params.id as string,
        validateUserLinkPerson(req.body),
        res.locals.context?.userId,
      );
      return ResponseHandler.success({ res, code: 200, message: "User linked successfully", data: user });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  unlinkPerson: async (req: Request, res: Response) => {
    try {
      const user = await UserService.unlinkPerson(req.params.id as string, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "User unlinked successfully", data: user });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  verifyEmail: async (req: Request, res: Response) => {
    try {
      const data = validateUserVerifyEmail(req.body);
      const user = await UserService.verifyEmail(req.params.id as string, data.reason, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Email verified successfully", data: user });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  restore: async (req: Request, res: Response) => {
    try {
      const user = await UserService.restore(req.params.id as string, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "User restored successfully", data: user });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await UserService.delete(req.params.id as string, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "User deleted successfully", data: null });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
