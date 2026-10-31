import { Request, Response } from "express";
import { SalaryComponentService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateSalaryComponentCreate, validateSalaryComponentUpdate } from "./validator";

export const SalaryComponentController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await SalaryComponentService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
        isActive,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Salary components fetched successfully!",
        data: {
          data: result.components,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateSalaryComponentCreate(req.body);
      const userId = res.locals.context?.userId;

      const component = await SalaryComponentService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Salary component created successfully",
        data: component,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const component = await SalaryComponentService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Salary component retrieved successfully",
        data: component,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateSalaryComponentUpdate(req.body);
      const userId = res.locals.context?.userId;

      const component = await SalaryComponentService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Salary component updated successfully",
        data: component,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await SalaryComponentService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Salary component deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
