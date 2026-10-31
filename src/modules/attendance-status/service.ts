import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { calculateSkipAndTake } from "@/utils/queryFilters";
import {
  AttendanceStatusCreateInput,
  AttendanceStatusUpdateInput,
} from "./validator";

export const AttendanceStatusService = {
  async index(query: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit ? query.limit : 10; // limit = -1 returns everything (useful for dropdowns)
    const { skip, take } = calculateSkipAndTake(page, limit);

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { code: { contains: query.search, mode: "insensitive" } },
        { name: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.isActive !== undefined) {
      whereClause.isActive = query.isActive;
    }

    const [items, total] = await Promise.all([
      prismaMain.attendanceStatus.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { name: "asc" },
      }),
      prismaMain.attendanceStatus.count({ where: whereClause }),
    ]);

    return {
      data: items,
      pagination: { page, limit, total },
    };
  },

  async create(data: AttendanceStatusCreateInput, userId?: string) {
    // The unique index on code also covers soft-deleted rows, so check without the deletedAt filter
    const existing = await prismaMain.attendanceStatus.findFirst({
      where: { code: data.code },
    });

    if (existing) {
      throw new CustomError(
        existing.deletedAt
          ? "A deleted attendance status already uses this code. Use a different code."
          : "An attendance status with this code already exists",
        409,
      );
    }

    try {
      return await prismaMain.attendanceStatus.create({
        data: {
          ...data,
          createdBy: userId,
        },
      });
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError(
          "An attendance status with this code already exists",
          409,
        );
      }
      throw error;
    }
  },

  async getById(id: string) {
    const item = await prismaMain.attendanceStatus.findFirst({
      where: { id, deletedAt: null },
    });

    if (!item) {
      throw new CustomError("Attendance status not found", 404);
    }

    return item;
  },

  async update(id: string, data: AttendanceStatusUpdateInput, userId?: string) {
    const existing = await prismaMain.attendanceStatus.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Attendance status not found", 404);
    }

    if (data.code && data.code !== existing.code) {
      const duplicate = await prismaMain.attendanceStatus.findFirst({
        where: { code: data.code, NOT: { id } },
      });

      if (duplicate) {
        throw new CustomError(
          "An attendance status with this code already exists",
          409,
        );
      }
    }

    try {
      return await prismaMain.attendanceStatus.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        },
      });
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError(
          "An attendance status with this code already exists",
          409,
        );
      }
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.attendanceStatus.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Attendance status not found", 404);
    }

    // Block deletion while other records still reference this row
    const usage = await Promise.all([
      prismaMain.studentAttendance.count({
        where: { statusId: id, deletedAt: null },
      }),
      prismaMain.employeeAttendance.count({
        where: { statusId: id, deletedAt: null },
      }),
    ]);

    if (usage.some((count) => count > 0)) {
      throw new CustomError(
        "This attendance status is in use and cannot be deleted. Deactivate it instead.",
        409,
      );
    }

    await prismaMain.attendanceStatus.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
