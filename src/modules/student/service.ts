import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { StudentCreateInput, StudentUpdateInput } from "./validator";

export const StudentService = {
  async index(query: { page?: number; limit?: number; search?: string; status?: string; approvalStatus?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
        { universityRegNo: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.status) {
      whereClause.status = query.status;
    }

    if (query.approvalStatus) {
      whereClause.approvalStatus = query.approvalStatus;
    }

    const [students, total] = await Promise.all([
      prismaMain.student.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          batch: true,
          guardians: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.student.count({ where: whereClause }),
    ]);

    return {
      students,
      pagination: {
        page,
        limit,
        total,
      },
    };
  },

  async create(data: StudentCreateInput, userId?: string) {
    // Validate batch exists and is not soft-deleted
    const batch = await prismaMain.batch.findFirst({
      where: { id: data.batchId, deletedAt: null },
    });

    if (!batch) {
      throw new CustomError("Batch not found or has been deleted", 404);
    }

    // Check duplicate universityRegNo
    const existingRegNo = await prismaMain.student.findFirst({
      where: { universityRegNo: data.universityRegNo, deletedAt: null },
    });

    if (existingRegNo) {
      throw new CustomError("A student with this university registration number already exists", 409);
    }

    // Validate userId if provided
    if (data.userId) {
      const user = await prismaMain.user.findFirst({
        where: { id: data.userId, deletedAt: null },
      });
      if (!user) {
        throw new CustomError("User not found or has been deleted", 404);
      }
    } else {
      // If no userId provided, reject creation of non-PENDING students
      if (data.approvalStatus !== "APPROVED") {
        throw new CustomError("User ID is required for students that are not yet approved", 400);
      }
    }

    try {
      const student = await prismaMain.student.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          batch: true,
          guardians: true,
        },
      });
      return student;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A student with this university registration number already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const student = await prismaMain.student.findFirst({
      where: { id, deletedAt: null },
      include: {
        batch: true,
        guardians: true,
        fees: true,
        payments: true,
      },
    });

    if (!student) {
      throw new CustomError("Student not found", 404);
    }

    return student;
  },

  async update(id: string, data: StudentUpdateInput, userId?: string) {
    const existing = await prismaMain.student.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Student not found", 404);
    }

    // Validate batch if changed
    if (data.batchId && data.batchId !== existing.batchId) {
      const batch = await prismaMain.batch.findFirst({
        where: { id: data.batchId, deletedAt: null },
      });
      if (!batch) {
        throw new CustomError("Batch not found or has been deleted", 404);
      }
    }

    try {
      const updated = await prismaMain.student.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        },
        include: {
          batch: true,
          guardians: true,
        },
      });
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A student with this university registration number already exists", 409);
      }
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.student.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Student not found", 404);
    }

    await prismaMain.student.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};