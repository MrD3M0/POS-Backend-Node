import { Request, Response } from "express";
import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { ClassScheduleService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateClassScheduleCreate, validateClassScheduleUpdate } from "./validator";

const DAY_OF_WEEK_VALUES = new Set([
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
]);

/**
 * Resolves the teacher profile id for a logged-in user (by userId).
 * Returns null when the user has no teacher profile or the profile is
 * soft-deleted.
 */
async function teacherIdForUser(userId?: string): Promise<string | null> {
  if (!userId) return null;
  const teacher = await prismaMain.teacher.findFirst({
    where: { deletedAt: null, employee: { userId, deletedAt: null } },
    select: { id: true },
  });
  return teacher?.id ?? null;
}

function teacherOnlyGuard(
  res: Response,
  role: string | undefined,
  requestedTeacherId: string,
  ownTeacherId: string | null,
): boolean {
  if (role !== "TEACHER") return false;
  if (!ownTeacherId || requestedTeacherId !== ownTeacherId) {
    ResponseHandler.error({
      res,
      code: 403,
      message: "You can only view your own schedule",
      error: null,
    });
    return true;
  }
  return false;
}

export const ClassScheduleController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const batchId = req.query.batchId as string | undefined;
      const batchTermId = req.query.batchTermId as string | undefined;
      const teacherId = req.query.teacherId as string | undefined;
      const dayOfWeek = req.query.dayOfWeek as string | undefined;
      const periodId = req.query.periodId as string | undefined;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;
      const role = res.locals.context?.role;
      const userId = res.locals.context?.userId;

      if (dayOfWeek && !DAY_OF_WEEK_VALUES.has(dayOfWeek)) {
        return ResponseHandler.success({
          res,
          code: 400,
          message: "dayOfWeek must be one of SUNDAY..SATURDAY",
          data: null,
        });
      }

      // Teacher role: force teacherId to their own profile (ignores any
      // teacherId in the query string; other-teacher scoping would 403).
      let effectiveTeacherId = teacherId;
      if (role === "TEACHER") {
        const own = await teacherIdForUser(userId);
        if (!own) {
          return ResponseHandler.error({
            res,
            code: 403,
            message: "No teacher profile is linked to this account",
            error: null,
          });
        }
        if (teacherId && teacherId !== own) {
          return ResponseHandler.error({
            res,
            code: 403,
            message: "You can only view your own schedule",
            error: null,
          });
        }
        effectiveTeacherId = own;
      }

      const result = await ClassScheduleService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
        batchId,
        batchTermId,
        teacherId: effectiveTeacherId,
        dayOfWeek,
        periodId,
        isActive,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Class schedules fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateClassScheduleCreate(req.body);
      const userId = res.locals.context?.userId;

      const classSchedule = await ClassScheduleService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Class schedule created successfully",
        data: classSchedule,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const role = res.locals.context?.role;
      const userId = res.locals.context?.userId;

      const classSchedule = await ClassScheduleService.getById(id);
      if (role === "TEACHER") {
        const own = await teacherIdForUser(userId);
        if (!own || classSchedule.teachingAssignment.teacherId !== own) {
          return ResponseHandler.error({
            res,
            code: 403,
            message: "You can only view your own schedule",
            error: null,
          });
        }
      }

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Class schedule retrieved successfully",
        data: classSchedule,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateClassScheduleUpdate(req.body);
      const userId = res.locals.context?.userId;

      const classSchedule = await ClassScheduleService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Class schedule updated successfully",
        data: classSchedule,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await ClassScheduleService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Class schedule deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  /** GET /class-schedule/teacher/:teacherId/week?fromBs&toBs */
  teacherWeek: async (req: Request, res: Response) => {
    try {
      const teacherId = req.params.teacherId as string;
      const fromBs = req.query.fromBs as string | undefined;
      const toBs = req.query.toBs as string | undefined;
      const role = res.locals.context?.role;
      const userId = res.locals.context?.userId;

      if (!fromBs || !toBs) {
        return ResponseHandler.error({
          res,
          code: 400,
          message: "fromBs and toBs query params are required",
          error: null,
        });
      }

      const own = await teacherIdForUser(userId);
      if (teacherOnlyGuard(res, role, teacherId, own)) return undefined;

      const events = await ClassScheduleService.teacherWeek(teacherId, fromBs, toBs);
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Teacher week schedule fetched successfully!",
        data: events,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  /** GET /class-schedule/batch-term/:batchTermId/week?fromBs&toBs */
  batchTermWeek: async (req: Request, res: Response) => {
    try {
      const batchTermId = req.params.batchTermId as string;
      const fromBs = req.query.fromBs as string | undefined;
      const toBs = req.query.toBs as string | undefined;
      if (!fromBs || !toBs) {
        return ResponseHandler.error({
          res,
          code: 400,
          message: "fromBs and toBs query params are required",
          error: null,
        });
      }
      const events = await ClassScheduleService.batchTermWeek(batchTermId, fromBs, toBs);
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Batch term week schedule fetched successfully!",
        data: events,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  /** GET /class-schedule/calendar?teacherId&fromBs&toBs */
  calendar: async (req: Request, res: Response) => {
    try {
      const teacherId = req.query.teacherId as string | undefined;
      const fromBs = req.query.fromBs as string | undefined;
      const toBs = req.query.toBs as string | undefined;
      const role = res.locals.context?.role;
      const userId = res.locals.context?.userId;

      if (!fromBs || !toBs) {
        return ResponseHandler.error({
          res,
          code: 400,
          message: "fromBs and toBs query params are required",
          error: null,
        });
      }

      // Teacher role: force own teacher id
      let effectiveTeacherId: string | null = null;
      if (role === "TEACHER") {
        const own = await teacherIdForUser(userId);
        if (!own) {
          return ResponseHandler.error({
            res,
            code: 403,
            message: "No teacher profile is linked to this account",
            error: null,
          });
        }
        effectiveTeacherId = own;
      }

      const result = await ClassScheduleService.calendar(fromBs, toBs, effectiveTeacherId);
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Class schedule calendar fetched successfully!",
        data: result,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};