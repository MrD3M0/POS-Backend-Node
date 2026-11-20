import { Request, Response } from "express";
import { AuditLogService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";

export const AuditLogController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const result = await AuditLogService.index({
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        search,
        entity: req.query.entity as string | undefined,
        entityId: req.query.entityId as string | undefined,
        action: req.query.action as string | undefined,
        userId: req.query.userId as string | undefined,
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
      });
      return ResponseHandler.success({ res, code: 200, message: "Audit log fetched", data: result });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  options: async (_req: Request, res: Response) => {
    try {
      const options = await AuditLogService.filterOptions();
      return ResponseHandler.success({ res, code: 200, message: "Audit filters fetched", data: options });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const log = await AuditLogService.getById(req.params.id as string);
      return ResponseHandler.success({ res, code: 200, message: "Audit entry fetched", data: log });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
