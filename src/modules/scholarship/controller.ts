import { Request, Response } from "express";
import { ScholarshipService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import {
  validateScholarshipCreate,
  validateScholarshipGrant,
  validateScholarshipUpdate,
} from "./validator";

export const ScholarshipController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const result = await ScholarshipService.index({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search,
      });
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Scholarships fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validated = validateScholarshipCreate(req.body);
      const scholarship = await ScholarshipService.create(
        validated,
        res.locals.context?.userId,
      );
      return ResponseHandler.success({
        res,
        code: 201,
        message: "Scholarship created successfully",
        data: scholarship,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const validated = validateScholarshipUpdate(req.body);
      const scholarship = await ScholarshipService.update(
        req.params.id as string,
        validated,
        res.locals.context?.userId,
      );
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Scholarship updated successfully",
        data: scholarship,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await ScholarshipService.delete(
        req.params.id as string,
        res.locals.context?.userId,
      );
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Scholarship deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  listGrants: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const result = await ScholarshipService.listGrants({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search,
        studentId: req.query.studentId as string | undefined,
        scholarshipId: req.query.scholarshipId as string | undefined,
      });
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Scholarship grants fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  grant: async (req: Request, res: Response) => {
    try {
      const validated = validateScholarshipGrant(req.body);
      const result = await ScholarshipService.grant(
        validated,
        res.locals.context?.userId,
      );
      return ResponseHandler.success({
        res,
        code: 201,
        message: "Scholarship granted successfully",
        data: result,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  revoke: async (req: Request, res: Response) => {
    try {
      const result = await ScholarshipService.revoke(
        req.params.id as string,
        res.locals.context?.userId,
      );
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Scholarship revoked successfully",
        data: result,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
