"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthorizedTo = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
// Must be used AFTER isUser, because it reads res.locals.context.userId
const isAuthorizedTo = (...allowedRoles) => {
    // Fail at startup (not at request time) if someone passes no roles
    if (allowedRoles.length === 0)
        throw new Error("canBeAccessedBy needs at least one role");
    return async (req, res, next) => {
        try {
            // Get the user info set by the isUser middleware
            const context = res.locals.context;
            if (!context?.userId)
                return response_1.ResponseHandler.error({
                    res,
                    code: 401,
                    message: "Unauthorized",
                    error: null,
                });
            // Check the role from the database, not only from the token
            const user = await prismaClient_1.prismaMain.user.findFirst({
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
                return response_1.ResponseHandler.error({
                    res,
                    code: 403,
                    message: "You do not have permission to perform this action",
                    error: null,
                });
            next();
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    };
};
exports.isAuthorizedTo = isAuthorizedTo;
