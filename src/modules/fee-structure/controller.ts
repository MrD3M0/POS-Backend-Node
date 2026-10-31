import { Request, Response } from "express";
import { FeeStructureService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateFeeStructureCreate } from "./validator";

export const FeeStructureController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await FeeStructureService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Fee structures fetched successfully!",
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
      const validatedData = validateFeeStructureCreate(req.body);
      const userId = res.locals.context?.userId;

      const structure = await FeeStructureService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Fee structure created successfully",
        data: structure,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const structure = await FeeStructureService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Fee structure retrieved successfully",
        data: structure,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await FeeStructureService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Fee structure deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
