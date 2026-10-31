import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { GuardianCreateInput } from "./validator";

export const GuardianService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { fullName: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [guardians, total] = await Promise.all([
      prismaMain.guardian.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          relation: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.guardian.count({ where: whereClause }),
    ]);

    return {
      data: guardians,
      pagination: { page, limit, total },
    };
  },

  async create(data: GuardianCreateInput, userId?: string) {
    try {
      const guardian = await prismaMain.guardian.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          relation: true,
        },
      });
      return guardian;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A guardian with this student and relation already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const guardian = await prismaMain.guardian.findFirst({
      where: { id, deletedAt: null },
      include: {
        relation: true,
      },
    });

    if (!guardian) {
      throw new CustomError("Guardian not found", 404);
    }

    return guardian;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.guardian.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Guardian not found", 404);
    }

    await prismaMain.guardian.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
