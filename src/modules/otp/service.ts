import bcrypt from "bcrypt";
import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { OtpCreateInput } from "./validator";

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

export const OtpService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (query.search) {
      whereClause.userId = query.search;
    }

    const [otps, total] = await Promise.all([
      prismaMain.otp.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: otpSelect,
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.otp.count({ where: whereClause }),
    ]);

    return {
      data: otps,
      pagination: { page, limit, total },
    };
  },

  async create(data: OtpCreateInput) {
    const user = await prismaMain.user.findFirst({
      where: { id: data.userId, deletedAt: null },
      select: { id: true },
    });

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    const codeHash = await bcrypt.hash(data.code, 10);

    const otp = await prismaMain.otp.create({
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

  async getById(id: string) {
    const otp = await prismaMain.otp.findFirst({
      where: { id },
      select: otpSelect,
    });

    if (!otp) {
      throw new CustomError("OTP not found", 404);
    }

    return otp;
  },

  async delete(id: string) {
    const existing = await prismaMain.otp.findFirst({
      where: { id },
    });

    if (!existing) {
      throw new CustomError("OTP not found", 404);
    }

    // OTPs are ephemeral; remove them instead of soft-deleting
    await prismaMain.otp.delete({
      where: { id },
    });

    return null;
  },
};
