import { Request, Response } from "express";
import { SalaryStructureItemService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateSalaryStructureItemCreate, validateSalaryStructureItemUpdate } from "./validator";

export const SalaryStructureItemController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await SalaryStructureItemService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Salary structure items fetched successfully!",
        data: {
          data: result.items,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateSalaryStructureItemCreate(req.body);
      const userId = res.locals.context?.userId;

      const item = await SalaryStructureItemService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Salary structure item created successfully",
        data: item,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const item = await SalaryStructureItemService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Salary structure item retrieved successfully",
        data: item,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateSalaryStructureItemUpdate(req.body);
      const userId = res.locals.context?.userId;

      const item = await SalaryStructureItemService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Salary structure item updated successfully",
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

      await SalaryStructureItemService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Salary structure item deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
