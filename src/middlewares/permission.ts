import type { NextFunction, Request, Response } from "express";
import { prismaMain } from "@/lib/prismaClient";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { can, type T_Action, type T_Module } from "@/permissions/permissions";

/**
 * Permission guard backed by the single permission matrix.
 * Must run AFTER `isUser` (reads `res.locals.context`).
 * Re-checks the user in the database so a deactivated/deleted/locked account
 * is rejected even while an old token is still valid.
 */
export const requirePermission =
  (module: T_Module, action: T_Action) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = res.locals.context as
        | { userId?: string; role?: string }
        | undefined;

      if (!context?.userId) {
        return ResponseHandler.error({
          res,
          code: 401,
          message: "Unauthorized",
          error: null,
        });
      }

      const user = await prismaMain.user.findFirst({
        where: { id: context.userId, deletedAt: null, isActive: true },
        select: { id: true, role: true, lockedUntil: true, isEmailVerified: true },
      });

      if (!user) {
        return ResponseHandler.error({
          res,
          code: 401,
          message: "This account is deactivated or no longer exists",
          error: null,
        });
      }

      if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
        return ResponseHandler.error({
          res,
          code: 403,
          message: "This account is temporarily locked",
          error: null,
        });
      }

      if (!can(user.role, module, action)) {
        return ResponseHandler.error({
          res,
          code: 403,
          message: "You do not have permission to perform this action",
          error: null,
        });
      }

      res.locals.context = { ...context, role: user.role };
      return next();
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  };
