import type { NextFunction, Request, Response } from "express";
import { prismaMain } from "@/lib/prismaClient";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";

// Keep in sync with `enum Role` in schema.prisma
export type T_Role =
  | "ADMIN"
  | "PRINCIPAL"
  | "ACCOUNTANT"
  | "TEACHER"
  | "STAFF"
  | "STUDENT";

// Must be used AFTER isUser, because it reads res.locals.context.userId
export const isAuthorizedTo = (...allowedRoles: T_Role[]) => {
  // Fail at startup (not at request time) if someone passes no roles
  if (allowedRoles.length === 0)
    throw new Error("canBeAccessedBy needs at least one role");

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get the user info set by the isUser middleware
      const context = res.locals.context;

      if (!context?.userId)
        return ResponseHandler.error({
          res,
          code: 401,
          message: "Unauthorized",
          error: null,
        });

      // Check the role from the database, not only from the token
      const user = await prismaMain.user.findFirst({
        where: {
          id: context.userId,
          role: { in: allowedRoles },
          isActive: true,
          deletedAt: null,
        },
        select: { id: true },
      });

      // If the user's role is not in the allowed list, block the request
      if (!user)
        return ResponseHandler.error({
          res,
          code: 403,
          message: "You do not have permission to perform this action",
          error: null,
        });

      next();
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  };
};