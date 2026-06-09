"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
exports.AuthService = {
    generateToken: (userId) => {
        const secret = process.env.JWT_SECRET;
        if (!secret)
            throw new Error("JWT_SECRET is not defined in .env");
        return jsonwebtoken_1.default.sign({ userId }, secret, {
            expiresIn: Number(process.env.JWT_EXPIRES_IN) || 3600,
        });
    },
    generateRefershToken: (userId) => {
        const secret = process.env.JWT_SECRET;
        if (!secret)
            throw new Error("JWT_SECRET is not defined in .env");
        return jsonwebtoken_1.default.sign({ userId }, secret, {
            expiresIn: Number(process.env.JWT_REFRESH_EXPIRES_IN) || 86400,
        });
    },
    verifyToken: (token) => {
        try {
            const secret = process.env.JWT_SECRET;
            if (!secret)
                throw new Error("JWT_SECRET is not defined");
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            return decoded;
        }
        catch (error) {
            return null;
        }
    },
};
