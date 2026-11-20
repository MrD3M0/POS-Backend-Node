import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import { computeStudentDues } from "@/lib/dues";
import { friendlyUniqueError } from "@/utils/employee";
import { isAutoAssignFeesOnAdmission } from "@/lib/settings";
import type { T_AutoAssignResult } from "@/modules/student-fee/service";
import {
  type Prisma,
  type StudentApprovalStatus,
  type StudentStatus,
} from "@/generated/prisma/client";
import {
  studentBulkImportInputSchema,
  StudentCreateInput,
  StudentUpdateInput,
} from "./validator";
import { z } from "zod";

const UNIQUE_MESSAGES: Record<string, string> = {
  universityRegNo: "A student with this university registration number already exists",
  userId: "This user is already linked to a student",
};

type BulkInput = z.infer<typeof studentBulkImportInputSchema>;

type StudentIndexQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  approvalStatus?: string;
  batchId?: string;
  courseId?: string;
  includeDeleted?: boolean;
};

/** Assigns the college fee of a student (batch override → course default). */
async function autoAssignFees(
  studentId: string,
  userId?: string,
): Promise<T_AutoAssignResult | undefined> {
  if (!(await isAutoAssignFeesOnAdmission())) return undefined;
  const { StudentFeeService } = await import("@/modules/student-fee/service");
  return StudentFeeService.assignOnAdmission(studentId, userId);
}

/**
 * A creator may not decide on their own student. The ADMIN is the approving
 * authority of the college and may also be its only approver, so the rule
 * only applies to creators that are not admins (a teacher, for example).
 */
async function assertCanDecideOnStudent(
  existing: { createdBy?: string | null },
  actorId: string | undefined,
  action: "approve" | "reject",
) {
  if (!actorId || !existing.createdBy || existing.createdBy !== actorId) return;
  const creator = await prismaMain.user.findFirst({
    where: { id: existing.createdBy, deletedAt: null },
    select: { role: true },
  });
  if (creator?.role === "ADMIN") return;
  throw new CustomError(`You cannot ${action} a student you created`, 403);
}

export const StudentService = {
  async index(query: StudentIndexQuery) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10, 200);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: Prisma.StudentWhereInput = query.includeDeleted
      ? {}
      : { deletedAt: null };

    if (query.search) {
      whereClause.OR = [
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
        { universityRegNo: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.status) {
      whereClause.status = query.status as StudentStatus;
    }

    if (query.approvalStatus) {
      whereClause.approvalStatus = query.approvalStatus as StudentApprovalStatus;
    }
    if (query.batchId) {
      whereClause.batchId = query.batchId;
    }
    if (query.courseId) {
      whereClause.batch = { courseId: query.courseId, deletedAt: null };
    }

    const [students, total] = await Promise.all([
      prismaMain.student.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: {
          batch: { include: { course: true } },
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

    // Check duplicate universityRegNo (friendly 409; P2002 mapped too,
    // including rows soft-deleted earlier which still hold the unique).
    // Only the id is selected: the dev DB stores the student status in a
    // lookup table, so reading every column would fail.
    const existingRegNo = await prismaMain.student.findFirst({
      where: { universityRegNo: data.universityRegNo },
      select: { id: true },
    });

    if (existingRegNo) {
      throw new CustomError("A student with this university registration number already exists", 409);
    }

    // Validate userId if provided (Student User account is optional).
    if (data.userId) {
      const user = await prismaMain.user.findFirst({
        where: { id: data.userId, deletedAt: null },
      });
      if (!user) {
        throw new CustomError("User not found or has been deleted", 404);
      }
    }

    // Exactly-one-primary guard for the optional inline guardians.
    const guardians = data.guardians ?? [];
    if (guardians.length > 0) {
      const primaries = guardians.filter((g) => g.isPrimary === true).length;
      if (!(guardians.length === 1 && primaries === 0) && primaries !== 1) {
        throw new CustomError("Exactly one guardian must be marked isPrimary", 400);
      }
    }

    const { guardians: _guardians, rejectionReason: _rejectionReason, ...studentData } = data;

    // Every new student starts PENDING: admitting a student is a separate,
    // explicit step (POST /student/:id/approve) — that is where the college
    // fee is assigned. Admin and teacher both go through the same gate.
    try {
      // Student + guardian(s) in one transaction; new students always
      // start PENDING (approval) + ACTIVE (status) regardless of input.
      return await prismaMain.$transaction(async (tx) => {
        const created = await tx.student.create({
          data: {
            ...studentData,
            approvalStatus: "PENDING",
            status: "ACTIVE",
            rejectionReason: null,
            createdBy: userId,
          },
        });

        if (guardians.length > 0) {
          await tx.guardian.createMany({
            data: guardians.map((g) => ({
              studentId: created.id,
              relation: g.relation,
              fullName: g.fullName,
              phone: g.phone ?? null,
              email: g.email ?? null,
              occupation: g.occupation ?? null,
              address: g.address ?? null,
              // A single guardian defaults to primary; otherwise the
              // validated exactly-one primary is preserved.
              isPrimary: guardians.length === 1 ? true : g.isPrimary === true,
              createdBy: userId,
            })),
          });
        }

        return tx.student.findUnique({
          where: { id: created.id },
          include: {
            batch: { include: { course: true } },
            guardians: true,
          },
        });
      });
    } catch (error) {
      const friendly = friendlyUniqueError(error, UNIQUE_MESSAGES);
      if (friendly) throw friendly;
      throw error;
    }
  },

  async getById(id: string) {
    const student = await prismaMain.student.findFirst({
      where: { id, deletedAt: null },
      include: {
        batch: { include: { course: true } },
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

    // approvalStatus/status must go through the dedicated endpoints.
    if (data.approvalStatus !== undefined && data.approvalStatus !== existing.approvalStatus) {
      throw new CustomError(
        "approvalStatus cannot be changed here; use POST /student/:id/approve, /reject or /resubmit",
        400,
      );
    }
    if (data.status !== undefined && data.status !== existing.status) {
      throw new CustomError(
        "status cannot be changed here; use POST /student/:id/change-status (ADMIN only, reason required)",
        400,
      );
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

    if (data.universityRegNo && data.universityRegNo !== existing.universityRegNo) {
      const duplicate = await prismaMain.student.findFirst({
        where: { universityRegNo: data.universityRegNo, NOT: { id } },
      });
      if (duplicate) {
        throw new CustomError("A student with this university registration number already exists", 409);
      }
    }

    const { approvalStatus: _a, status: _s, rejectionReason: _r, ...rest } = data;

    try {
      const updated = await prismaMain.student.update({
        where: { id },
        data: {
          ...rest,
          updatedBy: userId,
        },
        include: {
          batch: { include: { course: true } },
          guardians: true,
        },
      });
      return updated;
    } catch (error: any) {
      const friendly = friendlyUniqueError(error, UNIQUE_MESSAGES);
      if (friendly) throw friendly;
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

  // -------- Admission approval transitions (F4) --------
  // Allowed: PENDING -> APPROVED | REJECTED, REJECTED -> PENDING.
  // The creator cannot approve their own student (createdBy check);
  // the routes restrict approve/reject to ADMIN.
  async approve(id: string, actorId?: string) {
    const existing = await prismaMain.student.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        approvalStatus: true,
        status: true,
        createdBy: true,
      },
    });
    if (!existing) throw new CustomError("Student not found", 404);
    if (existing.approvalStatus !== "PENDING") {
      throw new CustomError(
        `Invalid transition ${existing.approvalStatus} -> APPROVED. Only PENDING students can be approved`,
        409,
      );
    }
    if (actorId && existing.createdBy && existing.createdBy === actorId) {
      await assertCanDecideOnStudent(existing, actorId, "approve");
    }

    const approved = await prismaMain.student.update({
      where: { id },
      data: {
        approvalStatus: "APPROVED",
        approvedBy: actorId,
        approvedAt: new Date(),
        rejectionReason: null,
        updatedBy: actorId,
      },
      include: { batch: { include: { course: true } }, guardians: true },
    });

    // The college fees are assigned right at admission: the fee structure of
    // the student's batch (or the course default) is copied to their fee.
    // A missing structure never blocks the approval — the result says what
    // happened so the accountant can finish it by hand.
    const feeAssignment = await autoAssignFees(id, actorId);

    return { ...approved, feeAssignment };
  },

  async reject(id: string, reason: string, actorId?: string) {
    const existing = await prismaMain.student.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        approvalStatus: true,
        status: true,
        createdBy: true,
      },
    });
    if (!existing) throw new CustomError("Student not found", 404);
    if (existing.approvalStatus !== "PENDING") {
      throw new CustomError(
        `Invalid transition ${existing.approvalStatus} -> REJECTED. Only PENDING students can be rejected`,
        409,
      );
    }
    if (actorId && existing.createdBy && existing.createdBy === actorId) {
      await assertCanDecideOnStudent(existing, actorId, "reject");
    }

    return prismaMain.student.update({
      where: { id },
      data: {
        approvalStatus: "REJECTED",
        rejectionReason: reason,
        approvedBy: actorId,
        approvedAt: new Date(),
        updatedBy: actorId,
      },
      include: { batch: { include: { course: true } }, guardians: true },
    });
  },

  async resubmit(id: string, actorId?: string) {
    const existing = await prismaMain.student.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        approvalStatus: true,
        status: true,
        createdBy: true,
      },
    });
    if (!existing) throw new CustomError("Student not found", 404);
    if (existing.approvalStatus !== "REJECTED") {
      throw new CustomError(
        `Invalid transition ${existing.approvalStatus} -> PENDING. Only REJECTED students can be resubmitted`,
        409,
      );
    }

    return prismaMain.student.update({
      where: { id },
      data: {
        approvalStatus: "PENDING",
        rejectionReason: null,
        approvedBy: null,
        approvedAt: null,
        updatedBy: actorId,
      },
      include: { batch: { include: { course: true } }, guardians: true },
    });
  },

  // ADMIN-only status change. Reason is required at the boundary and
  // returned in the response/audit note: the schema has no statusReason
  // column yet (DECISIONS.md Feature 4), so it is not persisted until
  // that diff + Audit Log land.
  async changeStatus(id: string, status: string, reason: string, actorId?: string) {
    const existing = await prismaMain.student.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        approvalStatus: true,
        status: true,
        createdBy: true,
      },
    });
    if (!existing) throw new CustomError("Student not found", 404);
    if (existing.status === status) {
      throw new CustomError(`Student is already ${status}`, 409);
    }

    const updated = await prismaMain.student.update({
      where: { id },
      data: { status: status as StudentStatus, updatedBy: actorId },
      include: { batch: { include: { course: true } }, guardians: true },
    });

    return {
      student: updated,
      statusReason: reason,
      auditNote: `Student ${updated.universityRegNo} status changed ${existing.status} -> ${status} by ${actorId ?? "admin"}: ${reason}`,
    };
  },

  // Bulk import: valid rows imported, invalid rows reported per-row.
  async bulkImport(data: BulkInput, userId?: string) {
    const rows = data.students;
    const results: {
      index: number;
      universityRegNo?: string;
      success: boolean;
      studentId?: string;
      error?: string;
    }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as StudentCreateInput;
      try {
        const created = await this.create(row, userId);
        results.push({
          index: i,
          universityRegNo: row.universityRegNo,
          success: true,
          studentId: created?.id,
        });
      } catch (error) {
        results.push({
          index: i,
          universityRegNo: row.universityRegNo,
          success: false,
          error:
            error instanceof Error ? error.message : "Import failed for this row",
        });
      }
    }

    const imported = results.filter((r) => r.success).length;
    return {
      total: rows.length,
      imported,
      failed: rows.length - imported,
      results,
    };
  },

  async bulkApprove(ids: string[], actorId?: string) {
    if (!Array.isArray(ids) || ids.length === 0) throw new CustomError("At least one student id is required", 400);
    const results: { id: string; success: boolean; error?: string }[] = [];
    const feeAssignments: {
      id: string;
      assigned: boolean;
      message?: string;
    }[] = [];
    for (const id of ids) {
      try {
        const approved = await this.approve(id, actorId);
        results.push({ id, success: true });
        feeAssignments.push({
          id,
          assigned: approved.feeAssignment?.assigned ?? false,
          message: approved.feeAssignment?.message,
        });
      } catch (error) {
        results.push({ id, success: false, error: error instanceof Error ? error.message : "Approval failed" });
      }
    }
    return {
      approved: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
      // The fee of every approved student is assigned automatically; this
      // tells the accountant which ones still need a fee by hand.
      feesAssigned: feeAssignments.filter((f) => f.assigned).length,
      feeAssignments,
    };
  },

  /** Dues & defaulter summary for GET /student/:id/dues. */
  async getDues(id: string) {
    return computeStudentDues(prismaMain, id);
  },
};