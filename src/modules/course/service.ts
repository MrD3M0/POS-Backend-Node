import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { CourseCreateInput, CourseUpdateInput } from "./validator";

export const CourseService = {
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

    const [courses, total] = await Promise.all([
      prismaMain.course.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.course.count({ where: whereClause }),
    ]);

    return {
      courses,
      pagination: {
        page,
        limit,
        total,
      },
    };
  },

  async create(data: CourseCreateInput, userId?: string) {
    const existing = await prismaMain.course.findFirst({
      where: { code: data.code, deletedAt: null },
    });

    if (existing) {
      throw new CustomError("A course with this code already exists", 409);
    }

    try {
      const course = await prismaMain.course.create({
        data: {
          ...data,
          createdBy: userId,
        },
      });
      return course;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A course with this code already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const course = await prismaMain.course.findFirst({
      where: { id, deletedAt: null },
      include: { batches: true, feeStructures: true },
    });

    if (!course) {
      throw new CustomError("Course not found", 404);
    }

    return course;
  },

  async update(id: string, data: CourseUpdateInput, userId?: string) {
    const course = await prismaMain.course.findFirst({
      where: { id, deletedAt: null },
    });

    if (!course) {
      throw new CustomError("Course not found", 404);
    }

    if (data.code) {
      const duplicate = await prismaMain.course.findFirst({
        where: {
          code: data.code,
          NOT: { id },
          deletedAt: null,
        },
      });

      if (duplicate) {
        throw new CustomError("A course with this code already exists", 409);
      }
    }

    try {
      const updated = await prismaMain.course.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        },
      });
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A course with this code already exists", 409);
      }
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const course = await prismaMain.course.findFirst({
      where: { id, deletedAt: null },
    });

    if (!course) {
      throw new CustomError("Course not found", 404);
    }

    await prismaMain.course.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
