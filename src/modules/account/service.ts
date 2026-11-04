import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { AccountCreateInput } from "./validator";

export const AccountService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { code: { contains: query.search, mode: "insensitive" } },
        { name: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [accounts, total] = await Promise.all([
      prismaMain.account.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          children: true,
          journalLines: true,
        },
      }),
      prismaMain.account.count({ where: whereClause }),
    ]);

    return {
      data: accounts,
      pagination: { page, limit, total },
    };
  },

  async create(data: AccountCreateInput, userId?: string) {
    try {
      const account = await prismaMain.account.create({
        data: {
          ...data,
          ...(userId && { createdBy: userId }),
        } as any,
        include: {
          children: true,
          journalLines: true,
        },
      });
      return account;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("An account with this code already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const account = await prismaMain.account.findFirst({
      where: { id, deletedAt: null },
      include: {
        children: true,
        journalLines: true,
      },
    });

    if (!account) {
      throw new CustomError("Account not found", 404);
    }

    return account;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.account.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Account not found", 404);
    }

    await prismaMain.account.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
