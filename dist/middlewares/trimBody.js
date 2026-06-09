"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trimBody = void 0;
const trimBody = function (req, res, next) {
    try {
        if (req.body && req.body !== undefined && typeof req.body === "object") {
            for (const [key, value] of Object.entries(req.body)) {
                if (typeof value === "string")
                    req.body[key] = value.trim();
            }
        }
        next();
    }
    catch (error) {
        // If any error occurs, handle the error
        return res.status(500).send({
            success: false,
            message: "Internal Server Error",
            error,
        });
    }
};
exports.trimBody = trimBody;
