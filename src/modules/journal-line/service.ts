import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { JournalLineCreateInput } from "./validator";

export const JournalLineService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { accountId: { contains: query.search, mode: "insensitive" } },
        { studentId: { contains: query.search, mode: "insensitive" } },
        { employeeId: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [lines, total] = await Promise.all([
      prismaMain.journalLine.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          account: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.journalLine.count({ where: whereClause }),
    ]);

    return {
      data: lines,
      pagination: { page, limit, total },
    };
  },

  async create(data: JournalLineCreateInput, userId?: string) {
    try {
      const line = await prismaMain.journalLine.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          account: true,
        },
      });
      return line;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A journal line already exists for this entry and account", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const line = await prismaMain.journalLine.findFirst({
      where: { id, deletedAt: null },
      include: {
        account: true,
      },
    });

    if (!line) {
      throw new CustomError("Journal line not found", 404);
    }

    return line;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.journalLine.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Journal line not found", 404);
    }

    await prismaMain.journalLine.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
