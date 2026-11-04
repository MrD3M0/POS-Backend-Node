import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { AttendanceSessionCreateInput } from "./validator";

export const AttendanceSessionService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { dateBs: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [sessions, total] = await Promise.all([
      prismaMain.attendanceSession.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          records: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.attendanceSession.count({ where: whereClause }),
    ]);

    return {
      data: sessions,
      pagination: { page, limit, total },
    };
  },

  async create(data: AttendanceSessionCreateInput, userId?: string) {
    try {
      const session = await prismaMain.attendanceSession.create({
        data: {
          ...data,
          ...(userId && { createdBy: userId }),
        },
        include: {
          records: true,
        },
      });
      return session;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("An attendance session with this date already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const session = await prismaMain.attendanceSession.findFirst({
      where: { id, deletedAt: null },
      include: {
        records: true,
      },
    });

    if (!session) {
      throw new CustomError("Attendance session not found", 404);
    }

    return session;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.attendanceSession.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Attendance session not found", 404);
    }

    await prismaMain.attendanceSession.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
