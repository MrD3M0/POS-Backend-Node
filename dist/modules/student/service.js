"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
const dues_1 = require("@/lib/dues");
const employee_1 = require("@/utils/employee");
const settings_1 = require("@/lib/settings");
const UNIQUE_MESSAGES = {
    universityRegNo: "A student with this university registration number already exists",
    userId: "This user is already linked to a student",
};
/** Assigns the college fee of a student (batch override → course default). */
async function autoAssignFees(studentId, userId) {
    if (!(await (0, settings_1.isAutoAssignFeesOnAdmission)()))
        return undefined;
    const { StudentFeeService } = await Promise.resolve().then(() => __importStar(require("@/modules/student-fee/service")));
    return StudentFeeService.assignOnAdmission(studentId, userId);
}
/**
 * A creator may not decide on their own student. The ADMIN is the approving
 * authority of the college and may also be its only approver, so the rule
 * only applies to creators that are not admins (a teacher, for example).
 */
async function assertCanDecideOnStudent(existing, actorId, action) {
    if (!actorId || !existing.createdBy || existing.createdBy !== actorId)
        return;
    const creator = await prismaClient_1.prismaMain.user.findFirst({
        where: { id: existing.createdBy, deletedAt: null },
        select: { role: true },
    });
    if (creator?.role === "ADMIN")
        return;
    throw new CustomError_1.CustomError(`You cannot ${action} a student you created`, 403);
}
exports.StudentService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10, 200);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = query.includeDeleted
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
            whereClause.status = query.status;
        }
        if (query.approvalStatus) {
            whereClause.approvalStatus = query.approvalStatus;
        }
        if (query.batchId) {
            whereClause.batchId = query.batchId;
        }
        if (query.courseId) {
            whereClause.batch = { courseId: query.courseId, deletedAt: null };
        }
        const [students, total] = await Promise.all([
            prismaClient_1.prismaMain.student.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    batch: { include: { course: true } },
                    guardians: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.student.count({ where: whereClause }),
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
    async create(data, userId) {
        // Validate batch exists and is not soft-deleted
        const batch = await prismaClient_1.prismaMain.batch.findFirst({
            where: { id: data.batchId, deletedAt: null },
        });
        if (!batch) {
            throw new CustomError_1.CustomError("Batch not found or has been deleted", 404);
        }
        // Check duplicate universityRegNo (friendly 409; P2002 mapped too,
        // including rows soft-deleted earlier which still hold the unique).
        // Only the id is selected: the dev DB stores the student status in a
        // lookup table, so reading every column would fail.
        const existingRegNo = await prismaClient_1.prismaMain.student.findFirst({
            where: { universityRegNo: data.universityRegNo },
            select: { id: true },
        });
        if (existingRegNo) {
            throw new CustomError_1.CustomError("A student with this university registration number already exists", 409);
        }
        // Validate userId if provided (Student User account is optional).
        if (data.userId) {
            const user = await prismaClient_1.prismaMain.user.findFirst({
                where: { id: data.userId, deletedAt: null },
            });
            if (!user) {
                throw new CustomError_1.CustomError("User not found or has been deleted", 404);
            }
        }
        // Exactly-one-primary guard for the optional inline guardians.
        const guardians = data.guardians ?? [];
        if (guardians.length > 0) {
            const primaries = guardians.filter((g) => g.isPrimary === true).length;
            if (!(guardians.length === 1 && primaries === 0) && primaries !== 1) {
                throw new CustomError_1.CustomError("Exactly one guardian must be marked isPrimary", 400);
            }
        }
        const { guardians: _guardians, rejectionReason: _rejectionReason, ...studentData } = data;
        // Every new student starts PENDING: admitting a student is a separate,
        // explicit step (POST /student/:id/approve) — that is where the college
        // fee is assigned. Admin and teacher both go through the same gate.
        try {
            // Student + guardian(s) in one transaction; new students always
            // start PENDING (approval) + ACTIVE (status) regardless of input.
            return await prismaClient_1.prismaMain.$transaction(async (tx) => {
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
        }
        catch (error) {
            const friendly = (0, employee_1.friendlyUniqueError)(error, UNIQUE_MESSAGES);
            if (friendly)
                throw friendly;
            throw error;
        }
    },
    async getById(id) {
        const student = await prismaClient_1.prismaMain.student.findFirst({
            where: { id, deletedAt: null },
            include: {
                batch: { include: { course: true } },
                guardians: true,
                fees: true,
                payments: true,
            },
        });
        if (!student) {
            throw new CustomError_1.CustomError("Student not found", 404);
        }
        return student;
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.student.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Student not found", 404);
        }
        // approvalStatus/status must go through the dedicated endpoints.
        if (data.approvalStatus !== undefined && data.approvalStatus !== existing.approvalStatus) {
            throw new CustomError_1.CustomError("approvalStatus cannot be changed here; use POST /student/:id/approve, /reject or /resubmit", 400);
        }
        if (data.status !== undefined && data.status !== existing.status) {
            throw new CustomError_1.CustomError("status cannot be changed here; use POST /student/:id/change-status (ADMIN only, reason required)", 400);
        }
        // Validate batch if changed
        if (data.batchId && data.batchId !== existing.batchId) {
            const batch = await prismaClient_1.prismaMain.batch.findFirst({
                where: { id: data.batchId, deletedAt: null },
            });
            if (!batch) {
                throw new CustomError_1.CustomError("Batch not found or has been deleted", 404);
            }
        }
        if (data.universityRegNo && data.universityRegNo !== existing.universityRegNo) {
            const duplicate = await prismaClient_1.prismaMain.student.findFirst({
                where: { universityRegNo: data.universityRegNo, NOT: { id } },
            });
            if (duplicate) {
                throw new CustomError_1.CustomError("A student with this university registration number already exists", 409);
            }
        }
        const { approvalStatus: _a, status: _s, rejectionReason: _r, ...rest } = data;
        try {
            const updated = await prismaClient_1.prismaMain.student.update({
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
        }
        catch (error) {
            const friendly = (0, employee_1.friendlyUniqueError)(error, UNIQUE_MESSAGES);
            if (friendly)
                throw friendly;
            throw error;
        }
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.student.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Student not found", 404);
        }
        await prismaClient_1.prismaMain.student.update({
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
    async approve(id, actorId) {
        const existing = await prismaClient_1.prismaMain.student.findFirst({
            where: { id, deletedAt: null },
            select: {
                id: true,
                approvalStatus: true,
                status: true,
                createdBy: true,
            },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Student not found", 404);
        if (existing.approvalStatus !== "PENDING") {
            throw new CustomError_1.CustomError(`Invalid transition ${existing.approvalStatus} -> APPROVED. Only PENDING students can be approved`, 409);
        }
        if (actorId && existing.createdBy && existing.createdBy === actorId) {
            await assertCanDecideOnStudent(existing, actorId, "approve");
        }
        const approved = await prismaClient_1.prismaMain.student.update({
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
    async reject(id, reason, actorId) {
        const existing = await prismaClient_1.prismaMain.student.findFirst({
            where: { id, deletedAt: null },
            select: {
                id: true,
                approvalStatus: true,
                status: true,
                createdBy: true,
            },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Student not found", 404);
        if (existing.approvalStatus !== "PENDING") {
            throw new CustomError_1.CustomError(`Invalid transition ${existing.approvalStatus} -> REJECTED. Only PENDING students can be rejected`, 409);
        }
        if (actorId && existing.createdBy && existing.createdBy === actorId) {
            await assertCanDecideOnStudent(existing, actorId, "reject");
        }
        return prismaClient_1.prismaMain.student.update({
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
    async resubmit(id, actorId) {
        const existing = await prismaClient_1.prismaMain.student.findFirst({
            where: { id, deletedAt: null },
            select: {
                id: true,
                approvalStatus: true,
                status: true,
                createdBy: true,
            },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Student not found", 404);
        if (existing.approvalStatus !== "REJECTED") {
            throw new CustomError_1.CustomError(`Invalid transition ${existing.approvalStatus} -> PENDING. Only REJECTED students can be resubmitted`, 409);
        }
        return prismaClient_1.prismaMain.student.update({
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
    async changeStatus(id, status, reason, actorId) {
        const existing = await prismaClient_1.prismaMain.student.findFirst({
            where: { id, deletedAt: null },
            select: {
                id: true,
                approvalStatus: true,
                status: true,
                createdBy: true,
            },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Student not found", 404);
        if (existing.status === status) {
            throw new CustomError_1.CustomError(`Student is already ${status}`, 409);
        }
        const updated = await prismaClient_1.prismaMain.student.update({
            where: { id },
            data: { status: status, updatedBy: actorId },
            include: { batch: { include: { course: true } }, guardians: true },
        });
        return {
            student: updated,
            statusReason: reason,
            auditNote: `Student ${updated.universityRegNo} status changed ${existing.status} -> ${status} by ${actorId ?? "admin"}: ${reason}`,
        };
    },
    // Bulk import: valid rows imported, invalid rows reported per-row.
    async bulkImport(data, userId) {
        const rows = data.students;
        const results = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                const created = await this.create(row, userId);
                results.push({
                    index: i,
                    universityRegNo: row.universityRegNo,
                    success: true,
                    studentId: created?.id,
                });
            }
            catch (error) {
                results.push({
                    index: i,
                    universityRegNo: row.universityRegNo,
                    success: false,
                    error: error instanceof Error ? error.message : "Import failed for this row",
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
    async bulkApprove(ids, actorId) {
        if (!Array.isArray(ids) || ids.length === 0)
            throw new CustomError_1.CustomError("At least one student id is required", 400);
        const results = [];
        const feeAssignments = [];
        for (const id of ids) {
            try {
                const approved = await this.approve(id, actorId);
                results.push({ id, success: true });
                feeAssignments.push({
                    id,
                    assigned: approved.feeAssignment?.assigned ?? false,
                    message: approved.feeAssignment?.message,
                });
            }
            catch (error) {
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
    async getDues(id) {
        return (0, dues_1.computeStudentDues)(prismaClient_1.prismaMain, id);
    },
};
