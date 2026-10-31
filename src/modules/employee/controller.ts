import { Request, Response } from "express";
import { EmployeeService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateEmployeeCreate, validateEmployeeUpdate } from "./validator";

export const EmployeeController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await EmployeeService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
        isActive,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Employees fetched successfully!",
        data: {
          data: result.employees,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateEmployeeCreate(req.body);
      const userId = res.locals.context?.userId;

      const employee = await EmployeeService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Employee created successfully",
        data: employee,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const employee = await EmployeeService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Employee retrieved successfully",
        data: employee,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateEmployeeUpdate(req.body);
      const userId = res.locals.context?.userId;

      const employee = await EmployeeService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Employee updated successfully",
        data: employee,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await EmployeeService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Employee deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};