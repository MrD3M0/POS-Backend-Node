"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherBatchPayService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
const bs_date_1 = require("@/utils/bs-date");
// Teaching assignment with the label data the UI needs (subject, teacher, class).
const TEACHING_ASSIGNMENT_INCLUDE = {
    teachingAssignment: {
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
            batchTermSubject: {
                include: {
                    subject: { select: { id: true, code: true, name: true } },
                    batchTerm: {
                        include: { batch: { select: { id: true, name: true } } },
                    },
                },
            },
        },
    },
};
// BS dates are YYYY-MM-DD strings, so lexical comparison is chronological.
// effectiveToBs null = open-ended (9999-12-31).
async function assertNoOverlap(teachingAssignmentId, fromBs, toBs, excludeId) {
    const existing = await prismaClient_1.prismaMain.teacherBatchPay.findMany({
        where: {
            teachingAssignmentId,
            deletedAt: null,
            ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
        select: { id: true, effectiveFromBs: true, effectiveToBs: true },
    });
    const newTo = toBs ?? "9999-12-31";
    for (const e of existing) {
        const eTo = e.effectiveToBs ?? "9999-12-31";
        // Overlap iff newFrom <= existingTo AND existingFrom <= newTo.
        if (fromBs <= eTo && e.effectiveFromBs <= newTo) {
            throw new CustomError_1.CustomError(`Pay range ${fromBs}..${toBs ?? "open"} overlaps an existing pay range ${e.effectiveFromBs}..${e.effectiveToBs ?? "open"} for this teaching assignment`, 409);
        }
    }
}
function assertExactlyOne(rate, fixed) {
    const hasFixed = fixed !== undefined && fixed !== null;
    const hasHourly = rate !== undefined && rate !== null;
    if (hasFixed && hasHourly) {
        throw new CustomError_1.CustomError("Provide exactly one of ratePerCreditHour or fixedMonthlyAmount, not both", 400);
    }
    if (!hasFixed && !hasHourly) {
        throw new CustomError_1.CustomError("Provide exactly one of ratePerCreditHour or fixedMonthlyAmount", 400);
    }
}
/** Roles allowed to create/update batch pays. Teachers are read-only. */
const WRITE_ROLES = ["ADMIN", "ACCOUNTANT"];
function assertCanWrite(role) {
    if (!role || !WRITE_ROLES.includes(role)) {
        throw new CustomError_1.CustomError("You do not have permission to manage batch pays", 403);
    }
}
/**
 * Resolves the teacher profile linked to the signed-in account. Teachers only
 * ever see and touch their own batch pays.
 */
async function resolveTeacherIdForUser(userId) {
    if (!userId)
        return null;
    const teacher = await prismaClient_1.prismaMain.teacher.findFirst({
        where: {
            deletedAt: null,
            employee: { userId, deletedAt: null },
        },
        select: { id: true },
    });
    return teacher?.id ?? null;
}
exports.TeacherBatchPayService = {
    async index(query, context) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = { deletedAt: null };
        // A teacher may only read their own batch pays.
        const teacherScope = context?.role === "TEACHER"
            ? await resolveTeacherIdForUser(context.userId)
            : null;
        if (context?.role === "TEACHER" && !teacherScope) {
            // No teacher profile linked to this account → nothing to show.
            return { pays: [], pagination: { page, limit, total: 0 } };
        }
        if (teacherScope) {
            whereClause.teachingAssignment = { teacherId: teacherScope };
        }
        if (query.teachingAssignmentId) {
            whereClause.teachingAssignmentId = query.teachingAssignmentId;
        }
        else if (query.search) {
            whereClause.teachingAssignmentId = {
                contains: query.search,
                mode: "insensitive",
            };
        }
        // Pays effective in a BS month (effectiveFromBs/effectiveToBs are BS strings):
        // effectiveFrom <= month end AND (effectiveTo IS NULL OR effectiveTo >= month start).
        if (query.yearBs && query.monthBs) {
            const { startBs, endBs } = (0, bs_date_1.bsMonthRange)(query.yearBs, query.monthBs);
            whereClause.effectiveFromBs = { lte: endBs };
            whereClause.OR = [
                { effectiveToBs: null },
                { effectiveToBs: { gte: startBs } },
            ];
        }
        const [pays, total] = await Promise.all([
            prismaClient_1.prismaMain.teacherBatchPay.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    ...TEACHING_ASSIGNMENT_INCLUDE,
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.teacherBatchPay.count({ where: whereClause }),
        ]);
        return {
            pays,
            pagination: {
                page,
                limit,
                total,
            },
        };
    },
    async create(data, userId, role) {
        // Teachers are read-only: only ADMIN/ACCOUNTANT may create batch pays.
        assertCanWrite(role);
        // Validate teachingAssignment exists and is not soft-deleted
        const assignment = await prismaClient_1.prismaMain.teachingAssignment.findFirst({
            where: { id: data.teachingAssignmentId, deletedAt: null },
        });
        if (!assignment) {
            throw new CustomError_1.CustomError("Teaching assignment not found or has been deleted", 404);
        }
        // Exactly one rate source: fixedMonthlyAmount XOR ratePerCreditHour.
        assertExactlyOne(data.ratePerCreditHour, data.fixedMonthlyAmount);
        if (data.effectiveToBs &&
            data.effectiveFromBs &&
            data.effectiveToBs < data.effectiveFromBs) {
            throw new CustomError_1.CustomError("effectiveToBs must be on or after effectiveFromBs", 400);
        }
        await assertNoOverlap(data.teachingAssignmentId, data.effectiveFromBs, data.effectiveToBs);
        try {
            const pay = await prismaClient_1.prismaMain.teacherBatchPay.create({
                data: {
                    ...data,
                    createdBy: userId,
                },
                include: {
                    ...TEACHING_ASSIGNMENT_INCLUDE,
                },
            });
            return pay;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("Duplicate entry found", 409);
            }
            throw error;
        }
    },
    async getById(id, context) {
        const pay = await prismaClient_1.prismaMain.teacherBatchPay.findFirst({
            where: { id, deletedAt: null },
            include: {
                ...TEACHING_ASSIGNMENT_INCLUDE,
            },
        });
        if (!pay) {
            throw new CustomError_1.CustomError("Teacher batch pay not found", 404);
        }
        // A teacher may only read their own batch pays.
        if (context?.role === "TEACHER") {
            const teacherId = await resolveTeacherIdForUser(context.userId);
            const ownerTeacherId = pay?.teachingAssignment?.teacherId;
            if (!teacherId || ownerTeacherId !== teacherId) {
                throw new CustomError_1.CustomError("You do not have permission to view this batch pay", 403);
            }
        }
        return pay;
    },
    async update(id, data, userId, role) {
        // Teachers are read-only: only ADMIN/ACCOUNTANT may change batch pays.
        assertCanWrite(role);
        const pay = await prismaClient_1.prismaMain.teacherBatchPay.findFirst({
            where: { id, deletedAt: null },
        });
        if (!pay) {
            throw new CustomError_1.CustomError("Teacher batch pay not found", 404);
        }
        // Merged values (partial update) must still satisfy exactly-one + range.
        const rate = data.ratePerCreditHour !== undefined
            ? data.ratePerCreditHour
            : (pay.ratePerCreditHour?.toString() ?? null);
        const fixed = data.fixedMonthlyAmount !== undefined
            ? data.fixedMonthlyAmount
            : (pay.fixedMonthlyAmount?.toString() ?? null);
        assertExactlyOne(rate ?? null, fixed ?? null);
        const fromBs = data.effectiveFromBs ?? pay.effectiveFromBs;
        const toBs = data.effectiveToBs !== undefined ? data.effectiveToBs : pay.effectiveToBs;
        if (toBs && toBs < fromBs) {
            throw new CustomError_1.CustomError("effectiveToBs must be on or after effectiveFromBs", 400);
        }
        const assignmentId = data.teachingAssignmentId ?? pay.teachingAssignmentId;
        if (data.teachingAssignmentId) {
            const assignment = await prismaClient_1.prismaMain.teachingAssignment.findFirst({
                where: { id: data.teachingAssignmentId, deletedAt: null },
            });
            if (!assignment)
                throw new CustomError_1.CustomError("Teaching assignment not found or has been deleted", 404);
        }
        await assertNoOverlap(assignmentId, fromBs, toBs, id);
        try {
            const updated = await prismaClient_1.prismaMain.teacherBatchPay.update({
                where: { id },
                data: {
                    ...data,
                    updatedBy: userId,
                },
                include: {
                    ...TEACHING_ASSIGNMENT_INCLUDE,
                },
            });
            return updated;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("Duplicate entry found", 409);
            }
            throw error;
        }
    },
    async delete(id, userId, role) {
        // Teachers are read-only: only ADMIN/ACCOUNTANT may remove batch pays.
        assertCanWrite(role);
        const pay = await prismaClient_1.prismaMain.teacherBatchPay.findFirst({
            where: { id, deletedAt: null },
        });
        if (!pay) {
            throw new CustomError_1.CustomError("Teacher batch pay not found", 404);
        }
        await prismaClient_1.prismaMain.teacherBatchPay.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
};
