import { Request, Response } from "express";
import { TaxSlabService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateTaxSlabCreate, validateTaxSlabUpdate } from "./validator";

export const TaxSlabController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const fiscalYearId = req.query.fiscalYearId as string | undefined;
      const isCouple = req.query.isCouple !== undefined ? req.query.isCouple === "true" : undefined;
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await TaxSlabService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
        fiscalYearId,
        isCouple,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Tax slabs fetched successfully!",
        data: {
          data: result.taxSlabs,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateTaxSlabCreate(req.body);
      const userId = res.locals.context?.userId;

      const taxSlab = await TaxSlabService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Tax slab created successfully",
        data: taxSlab,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const taxSlab = await TaxSlabService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Tax slab retrieved successfully",
        data: taxSlab,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateTaxSlabUpdate(req.body);
      const userId = res.locals.context?.userId;

      const taxSlab = await TaxSlabService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Tax slab updated successfully",
        data: taxSlab,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await TaxSlabService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Tax slab deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
