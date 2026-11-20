import { Request, Response } from "express";
import { PrincipalService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validatePrincipalCreate, validatePrincipalUpdate } from "./validator";

export const PrincipalController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await PrincipalService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Principals fetched successfully!",
        data: {
          data: result.principals,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validatePrincipalCreate(req.body);
      const userId = res.locals.context?.userId;

      const principal = await PrincipalService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Principal created successfully",
        data: principal,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const principal = await PrincipalService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Principal retrieved successfully",
        data: principal,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validatePrincipalUpdate(req.body);
      const userId = res.locals.context?.userId;

      const principal = await PrincipalService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Principal updated successfully",
        data: principal,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await PrincipalService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Principal deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};