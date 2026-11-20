"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const permissions_1 = require("@/permissions/permissions");
/**
 * Permission guard backed by the single permission matrix.
 * Must run AFTER `isUser` (reads `res.locals.context`).
 * Re-checks the user in the database so a deactivated/deleted/locked account
 * is rejected even while an old token is still valid.
 */
const requirePermission = (module, action) => async (req, res, next) => {
    try {
        const context = res.locals.context;
        if (!context?.userId) {
            return response_1.ResponseHandler.error({
                res,
                code: 401,
                message: "Unauthorized",
                error: null,
            });
        }
        const user = await prismaClient_1.prismaMain.user.findFirst({
            where: { id: context.userId, deletedAt: null, isActive: true },
            select: { id: true, role: true, lockedUntil: true, isEmailVerified: true },
        });
        if (!user) {
            return response_1.ResponseHandler.error({
                res,
                code: 401,
                message: "This account is deactivated or no longer exists",
                error: null,
            });
        }
        if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
            return response_1.ResponseHandler.error({
                res,
                code: 403,
                message: "This account is temporarily locked",
                error: null,
            });
        }
        if (!(0, permissions_1.can)(user.role, module, action)) {
            return response_1.ResponseHandler.error({
                res,
                code: 403,
                message: "You do not have permission to perform this action",
                error: null,
            });
        }
        res.locals.context = { ...context, role: user.role };
        return next();
    }
    catch (error) {
        return error_1.ErrorHandler.handleError(res, error);
    }
};
exports.requirePermission = requirePermission;
