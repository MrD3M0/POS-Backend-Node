"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
exports.NotificationController = {
    index: async (req, res) => {
        try {
            const limit = (0, queryFilters_1.resolvePageLimit)(req.query.limit, 10, 50);
            const feed = await service_1.NotificationService.getFeed({
                userId: res.locals.context?.userId,
                role: res.locals.context?.role,
            }, limit);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Notifications fetched successfully!",
                data: feed,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
