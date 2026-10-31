import { Request, Response } from "express";
import { GuardianService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateGuardianCreate } from "./validator";

export const GuardianController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await GuardianService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Guardians fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateGuardianCreate(req.body);
      const userId = res.locals.context?.userId;

      const guardian = await GuardianService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Guardian created successfully",
        data: guardian,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const guardian = await GuardianService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Guardian retrieved successfully",
        data: guardian,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await GuardianService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Guardian deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
