import { Request, Response } from "express";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import {
  validateWorkflowStatusCreate,
  validateWorkflowStatusUpdate,
} from "./validator";
import { WorkflowStatusService } from "./service";

export const WorkflowStatusController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;
      const isActive =
        req.query.isActive !== undefined
          ? req.query.isActive === "true"
          : undefined;

      const result = await WorkflowStatusService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
        isActive,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Workflow statuses fetched successfully!",
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
      const validatedData = validateWorkflowStatusCreate(req.body);
      const userId = res.locals.context?.userId;

      const item = await WorkflowStatusService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Workflow status created successfully",
        data: item,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const item = await WorkflowStatusService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Workflow status retrieved successfully",
        data: item,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateWorkflowStatusUpdate(req.body);
      const userId = res.locals.context?.userId;

      const item = await WorkflowStatusService.update(
        id,
        validatedData,
        userId,
      );

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Workflow status updated successfully",
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

      await WorkflowStatusService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Workflow status deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
