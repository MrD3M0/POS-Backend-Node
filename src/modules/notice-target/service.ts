import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { NoticeTargetCreateInput } from "./validator";

export const NoticeTargetService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { role: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [targets, total] = await Promise.all([
      prismaMain.noticeTarget.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          notice: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.noticeTarget.count({ where: whereClause }),
    ]);

    return {
      data: targets,
      pagination: { page, limit, total },
    };
  },

  async create(data: NoticeTargetCreateInput, userId?: string) {
    try {
      const target = await prismaMain.noticeTarget.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          notice: true,
        },
      });
      return target;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A notice target already exists for this notice and role", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const target = await prismaMain.noticeTarget.findFirst({
      where: { id, deletedAt: null },
      include: {
        notice: true,
      },
    });

    if (!target) {
      throw new CustomError("Notice target not found", 404);
    }

    return target;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.noticeTarget.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Notice target not found", 404);
    }

    await prismaMain.noticeTarget.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
