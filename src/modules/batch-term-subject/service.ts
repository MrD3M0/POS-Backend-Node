import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import {
  BatchTermSubjectBulkCreateInput,
  BatchTermSubjectCreateInput,
  BatchTermSubjectUpdateInput,
} from "./validator";

// Includes the data needed to render a readable subject/teacher/class label.
const BATCH_TERM_SUBJECT_INCLUDE = {
  subject: true,
  batchTerm: { include: { batch: true } },
  assignments: {
    where: { deletedAt: null },
    include: {
      teacher: {
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              middleName: true,
              lastName: true,
              employeeCode: true,
            },
          },
        },
      },
    },
  },
} as const;

export const BatchTermSubjectService = {
  async index(query: {
    page?: number;
    limit?: number;
    search?: string;
    batchTermId?: string;
    subjectId?: string;
    isElective?: boolean;
  }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { subject: { name: { contains: query.search, mode: "insensitive" } } },
        { subject: { code: { contains: query.search, mode: "insensitive" } } },
      ];
    }

    if (query.batchTermId) {
      whereClause.batchTermId = query.batchTermId;
    }

    if (query.subjectId) {
      whereClause.subjectId = query.subjectId;
    }

    if (query.isElective !== undefined) {
      whereClause.isElective = query.isElective;
    }

    const [batchTermSubjects, total] = await Promise.all([
      prismaMain.batchTermSubject.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: {
          ...BATCH_TERM_SUBJECT_INCLUDE,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.batchTermSubject.count({ where: whereClause }),
    ]);

    return {
      batchTermSubjects,
      pagination: {
        page,
        limit,
        total,
      },
    };
  },

  async create(data: BatchTermSubjectCreateInput, userId?: string) {
    // Validate that BatchTerm exists and is not soft-deleted
    const batchTerm = await prismaMain.batchTerm.findFirst({
      where: { id: data.batchTermId, deletedAt: null },
    });

    if (!batchTerm) {
      throw new CustomError("BatchTerm not found or has been deleted", 404);
    }

    // Validate that Subject exists and is not soft-deleted
    const subject = await prismaMain.subject.findFirst({
      where: { id: data.subjectId, deletedAt: null },
    });

    if (!subject) {
      throw new CustomError("Subject not found or has been deleted", 404);
    }

    // Check duplicate combination of batchTerm + subject
    const existing = await prismaMain.batchTermSubject.findFirst({
      where: {
        batchTermId: data.batchTermId,
        subjectId: data.subjectId,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new CustomError(
        `Subject ${subject.code} is already assigned to this batch term`,
        409,
      );
    }

    try {
      const batchTermSubject = await prismaMain.batchTermSubject.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          ...BATCH_TERM_SUBJECT_INCLUDE,
        },
      });
      return batchTermSubject;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError(
          `Subject ${subject.code} is already assigned to this batch term`,
          409,
        );
      }
      throw error;
    }
  },

  /**
   * Assigns multiple subjects to one batch term in a SINGLE transaction —
   * all rows succeed or nothing is written. Every failure is reported with a
   * specific reason (unknown subject, duplicate in payload, already assigned)
   * before any write happens, so partial states are impossible.
   */
  async bulkCreate(
    data: BatchTermSubjectBulkCreateInput,
    userId?: string,
  ): Promise<{ created: number; batchTermSubjects: unknown[] }> {
    const batchTerm = await prismaMain.batchTerm.findFirst({
      where: { id: data.batchTermId, deletedAt: null },
    });
    if (!batchTerm) {
      throw new CustomError("BatchTerm not found or has been deleted", 404);
    }

    const requested = data.subjects;
    const subjectIds = [...new Set(requested.map((row) => row.subjectId))];

    // Same subject twice in one request.
    if (subjectIds.length !== requested.length) {
      const seen = new Set<string>();
      const duplicated: string[] = [];
      for (const row of requested) {
        if (seen.has(row.subjectId)) duplicated.push(row.subjectId);
        seen.add(row.subjectId);
      }
      const codes = await prismaMain.subject.findMany({
        where: { id: { in: duplicated }, deletedAt: null },
        select: { code: true },
      });
      const label = codes.map((row) => row.code).join(", ");
      throw new CustomError(
        `Duplicate subject${duplicated.length > 1 ? "s" : ""} in the request${label ? `: ${label}` : ""}. Keep one row per subject.`,
        400,
      );
    }

    const subjects = await prismaMain.subject.findMany({
      where: { id: { in: subjectIds }, deletedAt: null },
      select: { id: true, code: true },
    });
    const subjectById = new Map(subjects.map((row) => [row.id, row]));

    // Unknown / soft-deleted subjects.
    const missing = subjectIds
      .filter((id) => !subjectById.has(id))
      .map((id) => id.slice(0, 8));
    if (missing.length > 0) {
      throw new CustomError(
        `Subject${missing.length > 1 ? "s" : ""} not found or deleted: ${missing.join(", ")}`,
        404,
      );
    }

    // Already assigned to this term (active rows only).
    const existing = await prismaMain.batchTermSubject.findMany({
      where: {
        batchTermId: data.batchTermId,
        subjectId: { in: subjectIds },
        deletedAt: null,
      },
      select: { subjectId: true },
    });
    if (existing.length > 0) {
      const codes = existing
        .map((row) => subjectById.get(row.subjectId)?.code ?? row.subjectId.slice(0, 8))
        .sort()
        .join(", ");
      throw new CustomError(
        `Subject${existing.length > 1 ? "s" : ""} already assigned to this batch term: ${codes}. Refresh the list — those subjects are now marked as assigned.`,
        409,
      );
    }

    const batchTermSubjects = await prismaMain.$transaction(async (tx) => {
      const rows: object[] = [];
      for (const row of requested) {
        rows.push(
          await tx.batchTermSubject.create({
            data: {
              batchTermId: data.batchTermId,
              subjectId: row.subjectId,
              creditHour: row.creditHour,
              isElective: row.isElective,
              // Seats only apply to electives; core subjects stay unlimited.
              maxStudents: row.isElective ? (row.maxStudents ?? null) : null,
              createdBy: userId,
            },
            include: { ...BATCH_TERM_SUBJECT_INCLUDE },
          }),
        );
      }
      return rows;
    });

    return { created: batchTermSubjects.length, batchTermSubjects };
  },

  async getById(id: string) {
    const batchTermSubject = await prismaMain.batchTermSubject.findFirst({
      where: { id, deletedAt: null },
      include: {
        subject: true,
        assignments: true,
        examSubjects: true,
      },
    });

    if (!batchTermSubject) {
      throw new CustomError("BatchTermSubject not found", 404);
    }

    return batchTermSubject;
  },

  async update(id: string, data: BatchTermSubjectUpdateInput, userId?: string) {
    const existing = await prismaMain.batchTermSubject.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("BatchTermSubject not found", 404);
    }

    // Validate batchTerm if changed
    if (data.batchTermId && data.batchTermId !== existing.batchTermId) {
      const batchTerm = await prismaMain.batchTerm.findFirst({
        where: { id: data.batchTermId, deletedAt: null },
      });
      if (!batchTerm) {
        throw new CustomError("BatchTerm not found or has been deleted", 404);
      }
    }

    // Validate subject if changed
    if (data.subjectId && data.subjectId !== existing.subjectId) {
      const subject = await prismaMain.subject.findFirst({
        where: { id: data.subjectId, deletedAt: null },
      });
      if (!subject) {
        throw new CustomError("Subject not found or has been deleted", 404);
      }
    }

    // Per-batch edit guard: syllabus edits are scoped to one batch.
    // (a) A row may not be moved to a BatchTerm of a different batch.
    // (b) Once referenced by a teaching assignment or exam subject, the
    //     batchTerm/subject identity is frozen (creditHour/isElective only).
    if (data.batchTermId && data.batchTermId !== existing.batchTermId) {
      const [oldTerm, newTerm] = await Promise.all([
        prismaMain.batchTerm.findFirst({ where: { id: existing.batchTermId } }),
        prismaMain.batchTerm.findFirst({
          where: { id: data.batchTermId, deletedAt: null },
        }),
      ]);
      if (newTerm && oldTerm && newTerm.batchId !== oldTerm.batchId) {
        throw new CustomError(
          "BatchTermSubject cannot be moved to a BatchTerm of a different batch (syllabus edits are per-batch)",
          409,
        );
      }
    }
    const identityChanged =
      (data.batchTermId && data.batchTermId !== existing.batchTermId) ||
      (data.subjectId && data.subjectId !== existing.subjectId);
    if (identityChanged) {
      const [assignment, examSubject] = await Promise.all([
        prismaMain.teachingAssignment.findFirst({
          where: { batchTermSubjectId: id, deletedAt: null },
        }),
        prismaMain.examSubject.findFirst({
          where: { batchTermSubjectId: id, deletedAt: null },
        }),
      ]);
      if (assignment || examSubject) {
        throw new CustomError(
          "This batch term subject is referenced by a teaching assignment or exam subject and cannot change batch term or subject",
          409,
        );
      }
    }

    try {
      const updated = await prismaMain.batchTermSubject.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        },
        include: {
          ...BATCH_TERM_SUBJECT_INCLUDE,
        },
      });
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError(
          "This subject is already assigned to this batch term",
          409,
        );
      }
      throw error;
    }
  },

  async copy(fromBatchTermId: string, toBatchTermId: string, userId?: string) {
    if (!fromBatchTermId || !toBatchTermId)
      throw new CustomError(
        "fromBatchTermId and toBatchTermId are required",
        400,
      );
    if (fromBatchTermId === toBatchTermId)
      throw new CustomError("Source and target term must be different", 400);

    const [fromTerm, toTerm] = await Promise.all([
      prismaMain.batchTerm.findFirst({
        where: { id: fromBatchTermId, deletedAt: null },
      }),
      prismaMain.batchTerm.findFirst({
        where: { id: toBatchTermId, deletedAt: null },
      }),
    ]);
    if (!fromTerm) throw new CustomError("Source batch term not found", 404);
    if (!toTerm) throw new CustomError("Target batch term not found", 404);

    const sourceRows = await prismaMain.batchTermSubject.findMany({
      where: { batchTermId: fromBatchTermId, deletedAt: null },
      select: { subjectId: true, creditHour: true, isElective: true, maxStudents: true },
    });
    if (sourceRows.length === 0)
      throw new CustomError("Source term has no subjects to copy", 409);

    const results: {
      subjectId: string;
      status: "copied" | "skipped";
      reason?: string;
    }[] = [];
    for (const row of sourceRows) {
      const exists = await prismaMain.batchTermSubject.findFirst({
        where: {
          batchTermId: toBatchTermId,
          subjectId: row.subjectId,
          deletedAt: null,
        },
      });
      if (exists) {
        results.push({
          subjectId: row.subjectId,
          status: "skipped",
          reason: "already exists",
        });
        continue;
      }
      await prismaMain.batchTermSubject.create({
        data: {
          batchTermId: toBatchTermId,
          subjectId: row.subjectId,
          creditHour: row.creditHour,
          isElective: row.isElective,
          maxStudents: row.isElective ? row.maxStudents : null,
          createdBy: userId,
        },
      });
      results.push({ subjectId: row.subjectId, status: "copied" });
    }

    return {
      fromBatchTermId,
      toBatchTermId,
      copied: results.filter((r) => r.status === "copied").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      results,
    };
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.batchTermSubject.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("BatchTermSubject not found", 404);
    }

    // Report exactly what is blocking removal so the admin knows what to
    // unlink first (teaching assignments, exam subjects, attendance sessions).
    const [assignmentCount, examSubjectCount, sessionCount] = await Promise.all([
      prismaMain.teachingAssignment.count({
        where: { batchTermSubjectId: id, deletedAt: null },
      }),
      prismaMain.examSubject.count({
        where: { batchTermSubjectId: id, deletedAt: null },
      }),
      prismaMain.attendanceSession.count({
        where: {
          deletedAt: null,
          teachingAssignment: { batchTermSubjectId: id },
        },
      }),
    ]);

    const linked: string[] = [];
    if (assignmentCount > 0) linked.push(`${assignmentCount} teaching assignment${assignmentCount > 1 ? "s" : ""}`);
    if (examSubjectCount > 0) linked.push(`${examSubjectCount} exam subject${examSubjectCount > 1 ? "s" : ""}`);
    if (sessionCount > 0) linked.push(`${sessionCount} attendance session${sessionCount > 1 ? "s" : ""}`);
    if (linked.length > 0) {
      throw new CustomError(
        `This subject cannot be removed because it is still linked to: ${linked.join(", ")}. Remove those links first.`,
        409,
      );
    }

    await prismaMain.batchTermSubject.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
