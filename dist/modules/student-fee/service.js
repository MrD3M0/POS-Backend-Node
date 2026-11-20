"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentFeeService = void 0;
exports.resolveFeeStructure = resolveFeeStructure;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const safe_select_1 = require("@/utils/safe-select");
const CustomError_1 = require("@/errors/CustomError");
const money_1 = require("@/lib/money");
const client_js_1 = require("../../generated/prisma/client.js");
/** Resolves the fee structure for a student: batch override before course default. */
async function resolveFeeStructure(studentBatchId, studentCourseId, explicitId) {
    if (explicitId) {
        const structure = await prismaClient_1.prismaMain.feeStructure.findFirst({
            where: { id: explicitId, deletedAt: null },
        });
        if (!structure) {
            throw new CustomError_1.CustomError("Fee structure not found", 404);
        }
        if (structure.courseId !== studentCourseId) {
            throw new CustomError_1.CustomError("Fee structure does not belong to the student's course", 400);
        }
        return structure;
    }
    const batchOverride = await prismaClient_1.prismaMain.feeStructure.findFirst({
        where: {
            batchId: studentBatchId,
            courseId: studentCourseId,
            isActive: true,
            deletedAt: null,
        },
    });
    if (batchOverride)
        return batchOverride;
    const courseDefault = await prismaClient_1.prismaMain.feeStructure.findFirst({
        where: {
            batchId: null,
            courseId: studentCourseId,
            isActive: true,
            deletedAt: null,
        },
    });
    if (courseDefault)
        return courseDefault;
    throw new CustomError_1.CustomError("No fee structure found for the student's batch or course", 400);
}
exports.StudentFeeService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {
            deletedAt: null,
        };
        if (query.studentId) {
            whereClause.studentId = query.studentId;
        }
        if (query.search) {
            whereClause.OR = [
                { studentId: { contains: query.search, mode: "insensitive" } },
                { feeStructureId: { contains: query.search, mode: "insensitive" } },
                {
                    student: {
                        universityRegNo: { contains: query.search, mode: "insensitive" },
                    },
                },
                {
                    student: {
                        firstName: { contains: query.search, mode: "insensitive" },
                    },
                },
                {
                    student: {
                        lastName: { contains: query.search, mode: "insensitive" },
                    },
                },
            ];
        }
        const [fees, total] = await Promise.all([
            prismaClient_1.prismaMain.studentFee.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    student: {
                        select: {
                            id: true,
                            universityRegNo: true,
                            firstName: true,
                            middleName: true,
                            lastName: true,
                        },
                    },
                    feeStructure: true,
                    items: { include: { feeHead: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.studentFee.count({ where: whereClause }),
        ]);
        return {
            data: fees,
            pagination: { page, limit, total },
        };
    },
    /**
     * Assigns fees to a student: copies every structure item into a student
     * fee item with netAmount = amount - discountAmount (= amount at copy
     * time, discount starts at zero). Batch override wins over the course
     * default unless an explicit feeStructureId is given.
     */
    async create(data, userId) {
        // Only the columns we need are selected: the dev database stores the
        // student status in lookup tables, so reading every student column would
        // fail with "column students.status does not exist".
        const student = await prismaClient_1.prismaMain.student.findFirst({
            where: { id: data.studentId, deletedAt: null },
            select: {
                id: true,
                batchId: true,
                batch: { select: { id: true, courseId: true, name: true } },
            },
        });
        if (!student) {
            throw new CustomError_1.CustomError("Student not found", 404);
        }
        const structure = await resolveFeeStructure(student.batchId, student.batch.courseId, data.feeStructureId);
        const alreadyAssigned = await prismaClient_1.prismaMain.studentFee.findFirst({
            where: {
                studentId: data.studentId,
                feeStructureId: structure.id,
                deletedAt: null,
            },
        });
        if (alreadyAssigned) {
            throw new CustomError_1.CustomError("Fee structure is already assigned to this student", 409);
        }
        const structureItems = await prismaClient_1.prismaMain.feeStructureItem.findMany({
            where: { feeStructureId: structure.id, deletedAt: null },
        });
        try {
            const fee = await prismaClient_1.prismaMain.studentFee.create({
                data: {
                    studentId: data.studentId,
                    feeStructureId: structure.id,
                    ...(userId && { createdBy: userId }),
                    items: {
                        create: structureItems.map((item) => ({
                            feeHeadId: item.feeHeadId,
                            feeStructureItemId: item.id,
                            termNumber: item.termNumber,
                            amount: item.amount,
                            discountAmount: 0,
                            netAmount: (0, money_1.round2)(item.amount),
                            ...(userId && { createdBy: userId }),
                        })),
                    },
                },
                include: {
                    student: { select: safe_select_1.STUDENT_SAFE_SELECT },
                    feeStructure: true,
                    items: { include: { feeHead: true } },
                },
            });
            return fee;
        }
        catch (error) {
            if (error?.code === "P2002") {
                throw new CustomError_1.CustomError("A student fee already exists for this student and structure", 409);
            }
            throw error;
        }
    },
    /**
     * Assigns the fee of a student when they are admitted (approved).
     *
     * The structure is resolved the same way as a manual assignment: the batch
     * override first, then the course default. Nothing is thrown — the student
     * is approved either way, the result simply says what happened so the UI
     * can tell the accountant to finish the job by hand.
     */
    async assignOnAdmission(studentId, userId) {
        try {
            // Only the needed columns: the dev DB stores the student status in a
            // lookup table, so reading every column would fail.
            const student = await prismaClient_1.prismaMain.student.findFirst({
                where: { id: studentId, deletedAt: null },
                select: {
                    id: true,
                    batchId: true,
                    batch: { select: { id: true, courseId: true, name: true } },
                },
            });
            if (!student) {
                return {
                    assigned: false,
                    reason: "ERROR",
                    message: "Student not found",
                };
            }
            let structure = null;
            try {
                const resolved = await resolveFeeStructure(student.batchId, student.batch.courseId);
                structure = { id: resolved.id, name: resolved.name };
            }
            catch {
                return {
                    assigned: false,
                    reason: "NO_STRUCTURE",
                    message: "No fee structure found for this batch or course — assign the fee manually.",
                };
            }
            const alreadyAssigned = await prismaClient_1.prismaMain.studentFee.findFirst({
                where: {
                    studentId: student.id,
                    feeStructureId: structure.id,
                    deletedAt: null,
                },
                select: { id: true },
            });
            if (alreadyAssigned) {
                return {
                    assigned: false,
                    reason: "ALREADY_ASSIGNED",
                    message: "This student already has this fee structure.",
                    feeStructureId: structure.id,
                    feeStructureName: structure.name,
                };
            }
            const fee = await this.create({ studentId: student.id, feeStructureId: structure.id }, userId);
            const total = (fee.items ?? []).reduce((sum, item) => sum.plus(item.netAmount ?? item.amount), new client_js_1.Prisma.Decimal(0));
            return {
                assigned: true,
                feeStructureId: structure.id,
                feeStructureName: structure.name,
                itemCount: fee.items?.length ?? 0,
                total: (0, money_1.round2)(total).toFixed(2),
            };
        }
        catch (error) {
            return {
                assigned: false,
                reason: "ERROR",
                message: error instanceof CustomError_1.CustomError
                    ? error.message
                    : "The fee could not be assigned automatically",
            };
        }
    },
    /**
     * Assigns a fee structure to many students at once (a whole batch of new
     * students, for example). Students that already have the structure are
     * skipped, and a failure on one student never stops the others.
     */
    async assignToMany(input, userId) {
        let studentIds = input.studentIds ?? [];
        if (input.batchId) {
            const batchStudents = await prismaClient_1.prismaMain.student.findMany({
                where: { batchId: input.batchId, deletedAt: null },
                select: { id: true },
            });
            studentIds = [
                ...new Set([...studentIds, ...batchStudents.map((row) => row.id)]),
            ];
        }
        if (studentIds.length === 0) {
            throw new CustomError_1.CustomError("No students to assign the fee to", 400);
        }
        const assigned = [];
        const skipped = [];
        const failures = [];
        for (const studentId of studentIds) {
            try {
                await this.create({ studentId, feeStructureId: input.feeStructureId }, userId);
                assigned.push(studentId);
            }
            catch (error) {
                const message = error instanceof CustomError_1.CustomError
                    ? error.message
                    : "Could not assign the fee to this student";
                if (/already assigned/i.test(message)) {
                    skipped.push(studentId);
                }
                else {
                    failures.push({ studentId, reason: message });
                }
            }
        }
        return {
            assigned: assigned.length,
            skipped: skipped.length,
            failed: failures.length,
            failures,
        };
    },
    async getById(id) {
        const fee = await prismaClient_1.prismaMain.studentFee.findFirst({
            where: { id, deletedAt: null },
            include: {
                student: { include: { batch: { include: { course: true } } } },
                feeStructure: true,
                items: { include: { feeHead: true, installments: true } },
            },
        });
        if (!fee) {
            throw new CustomError_1.CustomError("Student fee not found", 404);
        }
        return fee;
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.studentFee.findFirst({
            where: { id, deletedAt: null },
            include: {
                items: { where: { deletedAt: null }, include: { allocations: true } },
            },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Student fee not found", 404);
        }
        if (existing.items.some((item) => item.allocations.length > 0)) {
            throw new CustomError_1.CustomError("Student fee has payments allocated and cannot be deleted; skip or adjust its items instead", 409);
        }
        await prismaClient_1.prismaMain.studentFee.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
};
