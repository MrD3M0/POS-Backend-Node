import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import { ExamTypeCreateInput, ExamTypeUpdateInput } from "./validator";

export const ExamTypeService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 50);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: Record<string, unknown> = { deletedAt: null };
    if (query.search) {
      whereClause.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { code: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [examTypes, total] = await Promise.all([
      prismaMain.examType.findMany({ where: whereClause, skip, take: toPrismaTake(limit), orderBy: { createdAt: "desc" } }),
      prismaMain.examType.count({ where: whereClause }),
    ]);

    return { data: examTypes, pagination: { page, limit, total } };
  },

  async create(data: ExamTypeCreateInput, userId?: string) {
    try {
      return await prismaMain.examType.create({
        data: {
          code: data.code ?? data.name.trim().toUpperCase().replace(/\s+/g, "_").slice(0, 50),
          name: data.name,
          isActive: data.isActive ?? true,
          createdBy: userId,
        },
      });
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === "P2002") throw new CustomError("An exam type with this code or name already exists", 409);
      throw error;
    }
  },

  async getById(id: string) {
    const examType = await prismaMain.examType.findFirst({ where: { id, deletedAt: null } });
    if (!examType) throw new CustomError("Exam type not found", 404);
    return examType;
  },

  async update(id: string, data: ExamTypeUpdateInput, userId?: string) {
    const existing = await prismaMain.examType.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new CustomError("Exam type not found", 404);
    try {
      return await prismaMain.examType.update({ where: { id }, data: { ...data, updatedBy: userId } });
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === "P2002") throw new CustomError("An exam type with this code or name already exists", 409);
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.examType.findFirst({ where: { id, deletedAt: null }, include: { _count: { select: { exams: true } } } });
    if (!existing) throw new CustomError("Exam type not found", 404);
    if (existing._count.exams > 0) throw new CustomError(`Used by ${existing._count.exams} exams; deactivate instead`, 409);
    await prismaMain.examType.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: userId } });
    return null;
  },
};
