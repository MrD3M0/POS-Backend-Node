import { Request, Response } from "express";
import { SalaryStructureService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateSalaryStructureCreate, validateSalaryStructureUpdate } from "./validator";

export const SalaryStructureController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await SalaryStructureService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
        isActive,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Salary structures fetched successfully!",
        data: {
          data: result.structures,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateSalaryStructureCreate(req.body);
      const userId = res.locals.context?.userId;

      const structure = await SalaryStructureService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Salary structure created successfully",
        data: structure,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const structure = await SalaryStructureService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Salary structure retrieved successfully",
        data: structure,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateSalaryStructureUpdate(req.body);
      const userId = res.locals.context?.userId;

      const structure = await SalaryStructureService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Salary structure updated successfully",
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

      await SalaryStructureService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Salary structure deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
