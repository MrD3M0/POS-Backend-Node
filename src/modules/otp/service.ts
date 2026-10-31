import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { OtpCreateInput } from "./validator";

export const OtpService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { userId: { contains: query.search, mode: "insensitive" } },
        { code: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [otps, total] = await Promise.all([
      prismaMain.otp.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.otp.count({ where: whereClause }),
    ]);

    return {
      data: otps,
      pagination: { page, limit, total },
    };
  },

  async create(data: OtpCreateInput, userId?: string) {
    try {
      const otp = await prismaMain.otp.create({
        data: {
          ...data,
          userId,
          createdBy: userId,
        },
      });
      return otp;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("An OTP already exists for this user and expiry time", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const otp = await prismaMain.otp.findFirst({
      where: { id, deletedAt: null },
    });

    if (!otp) {
      throw new CustomError("OTP not found", 404);
    }

    return otp;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.otp.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("OTP not found", 404);
    }

    await prismaMain.otp.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return null;
  },
};
