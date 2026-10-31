import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { NoticeCreateInput } from "./validator";

export const NoticeService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { body: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [notices, total] = await Promise.all([
      prismaMain.notice.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          targets: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.notice.count({ where: whereClause }),
    ]);

    return {
      data: notices,
      pagination: { page, limit, total },
    };
  },

  async create(data: NoticeCreateInput, userId?: string) {
    try {
      const notice = await prismaMain.notice.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          targets: true,
        },
      });
      return notice;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A notice with this title already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const notice = await prismaMain.notice.findFirst({
      where: { id, deletedAt: null },
      include: {
        targets: true,
      },
    });

    if (!notice) {
      throw new CustomError("Notice not found", 404);
    }

    return notice;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.notice.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Notice not found", 404);
    }

    await prismaMain.notice.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
