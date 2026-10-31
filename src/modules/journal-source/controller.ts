import { Request, Response } from "express";

import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import {
  validateJournalSourceCreate,
  validateJournalSourceUpdate,
} from "./validator";
import { JournalSourceService } from "./service";

export const JournalSourceController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await JournalSourceService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Journal sources fetched successfully!",
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
      const validatedData = validateJournalSourceCreate(req.body);
      const userId = res.locals.context?.userId;

      const item = await JournalSourceService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Journal source created successfully",
        data: item,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const item = await JournalSourceService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Journal source retrieved successfully",
        data: item,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateJournalSourceUpdate(req.body);
      const userId = res.locals.context?.userId;

      const item = await JournalSourceService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Journal source updated successfully",
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

      await JournalSourceService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Journal source deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
