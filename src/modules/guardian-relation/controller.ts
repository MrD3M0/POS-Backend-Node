import { Request, Response } from "express";

import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import {
  validateGuardianRelationCreate,
  validateGuardianRelationUpdate,
} from "./validator";
import { GuardianRelationService } from "./service";

export const GuardianRelationController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;
      const isActive =
        req.query.isActive !== undefined
          ? req.query.isActive === "true"
          : undefined;

      const result = await GuardianRelationService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
        isActive,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Guardian relations fetched successfully!",
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
      const validatedData = validateGuardianRelationCreate(req.body);
      const userId = res.locals.context?.userId;

      const item = await GuardianRelationService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Guardian relation created successfully",
        data: item,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const item = await GuardianRelationService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Guardian relation retrieved successfully",
        data: item,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateGuardianRelationUpdate(req.body);
      const userId = res.locals.context?.userId;

      const item = await GuardianRelationService.update(
        id,
        validatedData,
        userId,
      );

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Guardian relation updated successfully",
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

      await GuardianRelationService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Guardian relation deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
