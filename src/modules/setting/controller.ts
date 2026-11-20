import { Request, Response } from "express";
import { SettingService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateSettingCreate, validateSettingUpdate, validateSettingValueBody } from "./validator";

export const SettingController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await SettingService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Settings fetched successfully!",
        data: {
          data: result.settings,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateSettingCreate(req.body);
      const userId = res.locals.context?.userId;

      const setting = await SettingService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Setting created successfully",
        data: setting,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const setting = await SettingService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Setting retrieved successfully",
        data: setting,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieveByKey: async (req: Request, res: Response) => {
    try {
      const key = req.params.key as string;
      const setting = await SettingService.getByKey(key);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Setting retrieved successfully",
        data: setting,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  effective: async (_req: Request, res: Response) => {
    try {
      const settings = await SettingService.effective();
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Effective settings fetched successfully",
        data: settings,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  institution: async (_req: Request, res: Response) => {
    try {
      const institution = await SettingService.institution();
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Institution details fetched successfully",
        data: institution,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  upsertByKey: async (req: Request, res: Response) => {
    try {
      const key = req.params.key as string;
      const { value } = validateSettingValueBody(req.body);
      const setting = await SettingService.upsertByKey(
        key,
        value,
        res.locals.context?.userId,
        res.locals.context?.role,
      );

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Setting saved successfully",
        data: setting,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateSettingUpdate(req.body);
      const userId = res.locals.context?.userId;

      const setting = await SettingService.update(
        id,
        validatedData,
        userId,
        res.locals.context?.role,
      );

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Setting updated successfully",
        data: setting,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await SettingService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Setting deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
