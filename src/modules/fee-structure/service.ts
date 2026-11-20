import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import {
  BATCH_SAFE_SELECT,
  COURSE_SAFE_SELECT,
} from "@/utils/safe-select";
import { FeeStructureCreateInput, FeeStructureUpdateInput } from "./validator";
import { dec } from "@/lib/money";

export const FeeStructureService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: Record<string, unknown> = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [structures, total] = await Promise.all([
      prismaMain.feeStructure.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: {
          items: { include: { feeHead: true } },
          course: { select: COURSE_SAFE_SELECT },
          batch: { select: BATCH_SAFE_SELECT },
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.feeStructure.count({ where: whereClause }),
    ]);

    return {
      data: structures,
      pagination: { page, limit, total },
    };
  },

  /**
   * Creates a fee structure. With batchId set, it is the override for that
   * batch; without it, it is the course-wide default. The batch must belong
   * to the given course. Items can be created nested in one call.
   */
  async create(data: FeeStructureCreateInput, userId?: string) {
    const course = await prismaMain.course.findFirst({
      where: { id: data.courseId, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!course) {
      throw new CustomError("Course not found", 404);
    }

    if (data.batchId) {
      const batch = await prismaMain.batch.findFirst({
        where: { id: data.batchId, deletedAt: null },
        select: { id: true, courseId: true, name: true },
      });
      if (!batch) {
        throw new CustomError("Batch not found", 404);
      }
      if (batch.courseId !== data.courseId) {
        throw new CustomError(
          "Batch does not belong to the given course",
          400,
        );
      }
    }

    if (data.items && data.items.length > 0) {
      const seen = new Set<string>();
      for (const item of data.items) {
        const key = `${item.feeHeadId}::${item.termNumber ?? "once"}`;
        if (seen.has(key)) {
          throw new CustomError(
            "Items must not repeat the same fee head and term",
            400,
          );
        }
        seen.add(key);
      }
      const heads = await prismaMain.feeHead.findMany({
        where: {
          id: { in: [...new Set(data.items.map((item) => item.feeHeadId))] },
          deletedAt: null,
        },
      });
      if (heads.length !== new Set(data.items.map((item) => item.feeHeadId)).size) {
        throw new CustomError("One or more fee heads not found", 404);
      }
      if (heads.some((head) => !head.isActive)) {
        throw new CustomError("One or more fee heads are inactive", 400);
      }
    }

    try {
      const structure = await prismaMain.feeStructure.create({
        data: {
          courseId: data.courseId,
          batchId: data.batchId ?? null,
          name: data.name,
          isActive: data.isActive ?? true,
          ...(userId && { createdBy: userId }),
          ...(data.items && data.items.length > 0
            ? {
                items: {
                  create: data.items.map((item) => ({
                    feeHeadId: item.feeHeadId,
                    termNumber: item.termNumber ?? null,
                    amount: dec(item.amount, "item amount"),
                    ...(userId && { createdBy: userId }),
                  })),
                },
              }
            : {}),
        },
        include: {
          items: { include: { feeHead: true } },
          course: { select: COURSE_SAFE_SELECT },
          batch: { select: BATCH_SAFE_SELECT },
        },
      });
      return structure;
    } catch (error: unknown) {
      if ((error as { code?: string } | null)?.code === "P2002") {
        throw new CustomError(
          "A fee structure item for this head and term already exists",
          409,
        );
      }
      throw error;
    }
  },

  async update(
    id: string,
    data: FeeStructureUpdateInput,
    userId?: string,
  ) {
    const existing = await prismaMain.feeStructure.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new CustomError("Fee structure not found", 404);
    }

    const courseId = data.courseId ?? existing.courseId;
    const course = await prismaMain.course.findFirst({
      where: { id: courseId, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!course) throw new CustomError("Course not found", 404);

    const batchId =
      data.batchId !== undefined ? data.batchId : existing.batchId;
    if (batchId) {
      const batch = await prismaMain.batch.findFirst({
        where: { id: batchId, deletedAt: null },
        select: { id: true, courseId: true, name: true },
      });
      if (!batch) throw new CustomError("Batch not found", 404);
      if (batch.courseId !== courseId) {
        throw new CustomError(
          "Batch does not belong to the given course",
          400,
        );
      }
    }

    if (data.items) {
      const seen = new Set<string>();
      for (const item of data.items) {
        const key = `${item.feeHeadId}::${item.termNumber ?? "once"}`;
        if (seen.has(key)) {
          throw new CustomError(
            "Items must not repeat the same fee head and term",
            400,
          );
        }
        seen.add(key);
      }
      const headIds = [...new Set(data.items.map((item) => item.feeHeadId))];
      const heads = await prismaMain.feeHead.findMany({
        where: { id: { in: headIds }, deletedAt: null },
      });
      if (heads.length !== headIds.length) {
        throw new CustomError("One or more fee heads not found", 404);
      }
      if (heads.some((head) => !head.isActive)) {
        throw new CustomError("One or more fee heads are inactive", 400);
      }
    }

    return prismaMain.$transaction(async (tx) => {
      if (data.items) {
        // The old rows are replaced; students that already got this structure
        // keep their own copy of the items.
        await tx.feeStructureItem.deleteMany({
          where: { feeStructureId: id, deletedAt: null },
        });
        if (data.items.length > 0) {
          await tx.feeStructureItem.createMany({
            data: data.items.map((item) => ({
              feeStructureId: id,
              feeHeadId: item.feeHeadId,
              termNumber: item.termNumber ?? null,
              amount: dec(item.amount, "item amount"),
              createdBy: userId ?? null,
              updatedBy: userId ?? null,
            })),
          });
        }
      }

      const structure = await tx.feeStructure.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name.trim() } : {}),
          ...(data.courseId !== undefined ? { courseId } : {}),
          ...(data.batchId !== undefined ? { batchId: batchId ?? null } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
          updatedBy: userId ?? null,
        },
        include: { items: { include: { feeHead: true } } },
      });
      return structure;
    });
  },

  async getById(id: string) {
    const structure = await prismaMain.feeStructure.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: { include: { feeHead: true } },
        course: { select: COURSE_SAFE_SELECT },
        batch: { select: BATCH_SAFE_SELECT },
      },
    });

    if (!structure) {
      throw new CustomError("Fee structure not found", 404);
    }

    return structure;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.feeStructure.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { studentFees: true } },
      },
    });

    if (!existing) {
      throw new CustomError("Fee structure not found", 404);
    }
    if (existing._count.studentFees > 0) {
      throw new CustomError(
        "Fee structure is assigned to students and cannot be deleted",
        409,
      );
    }

    await prismaMain.feeStructure.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
