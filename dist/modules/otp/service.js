"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
const service_1 = require("@/modules/auth/service");
// Never leak the code hash to API consumers
const otpSelect = {
    id: true,
    userId: true,
    purpose: true,
    attempts: true,
    expiresAt: true,
    consumedAt: true,
    createdAt: true,
};
exports.OtpService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {};
        if (query.search) {
            whereClause.userId = query.search;
        }
        const [otps, total] = await Promise.all([
            prismaClient_1.prismaMain.otp.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                select: otpSelect,
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.otp.count({ where: whereClause }),
        ]);
        return {
            data: otps,
            pagination: { page, limit, total },
        };
    },
    async create(data) {
        const user = await prismaClient_1.prismaMain.user.findFirst({
            where: { id: data.userId, deletedAt: null },
            select: { id: true },
        });
        if (!user) {
            throw new CustomError_1.CustomError("User not found", 404);
        }
        const codeHash = (0, service_1.hashOtpCode)(data.code);
        const otp = await prismaClient_1.prismaMain.otp.create({
            data: {
                userId: data.userId,
                purpose: data.purpose,
                codeHash,
                expiresAt: data.expiresAt,
            },
            select: otpSelect,
        });
        return otp;
    },
    async getById(id) {
        const otp = await prismaClient_1.prismaMain.otp.findFirst({
            where: { id },
            select: otpSelect,
        });
        if (!otp) {
            throw new CustomError_1.CustomError("OTP not found", 404);
        }
        return otp;
    },
    async delete(id) {
        const existing = await prismaClient_1.prismaMain.otp.findFirst({
            where: { id },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("OTP not found", 404);
        }
        // OTPs are ephemeral; remove them instead of soft-deleting
        await prismaClient_1.prismaMain.otp.delete({
            where: { id },
        });
        return null;
    },
};
