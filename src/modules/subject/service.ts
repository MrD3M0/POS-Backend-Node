import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { SubjectCreateInput, SubjectUpdateInput } from "./validator";

export const SubjectService = {
  async index(query: { page?: number; limit?: number; search?: string; isActive?: boolean }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { code: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.isActive !== undefined) {
      whereClause.isActive = query.isActive;
    }

    const [subjects, total] = await Promise.all([
      prismaMain.subject.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.subject.count({ where: whereClause }),
    ]);

    return {
      subjects,
      pagination: {
        page,
        limit,
        total,
      },
    };
  },

  async create(data: SubjectCreateInput, userId?: string) {
    const existing = await prismaMain.subject.findFirst({
      where: { code: data.code, deletedAt: null },
    });

    if (existing) {
      throw new CustomError("A subject with this code already exists", 409);
    }

    try {
      const subject = await prismaMain.subject.create({
        data: {
          ...data,
          createdBy: userId,
        },
      });
      return subject;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A subject with this code already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const subject = await prismaMain.subject.findFirst({
      where: { id, deletedAt: null },
    });

    if (!subject) {
      throw new CustomError("Subject not found", 404);
    }

    return subject;
  },

  async update(id: string, data: SubjectUpdateInput, userId?: string) {
    const subject = await prismaMain.subject.findFirst({
      where: { id, deletedAt: null },
    });

    if (!subject) {
      throw new CustomError("Subject not found", 404);
    }

    if (data.code && data.code !== subject.code) {
      const duplicate = await prismaMain.subject.findFirst({
        where: {
          code: data.code,
          NOT: { id },
          deletedAt: null,
        },
      });

      if (duplicate) {
        throw new CustomError("A subject with this code already exists", 409);
      }
    }

    try {
      const updated = await prismaMain.subject.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        },
      });
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A subject with this code already exists", 409);
      }
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const subject = await prismaMain.subject.findFirst({
      where: { id, deletedAt: null },
    });

    if (!subject) {
      throw new CustomError("Subject not found", 404);
    }

    await prismaMain.subject.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};