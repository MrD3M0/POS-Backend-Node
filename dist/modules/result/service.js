"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultService = void 0;
exports.computeResult = computeResult;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
// Allowed status transitions (server-side enforced)
// DRAFT/PENDING -> APPROVED|REJECTED -> PUBLISHED ; REJECTED -> PENDING (+recompute)
const ALLOWED_TRANSITIONS = {
    DRAFT: ["PENDING"],
    PENDING: ["APPROVED", "REJECTED"],
    REJECTED: ["PENDING"],
    APPROVED: ["PUBLISHED"],
    PUBLISHED: [],
};
const RESULT_STATUS_VALUES = [
    "DRAFT",
    "PENDING",
    "APPROVED",
    "REJECTED",
    "PUBLISHED",
];
const round2 = (n) => Math.round(n * 100) / 100;
// ---------------------------------------------------------------------
// Shared selection: mirrors the old hand-written SQL projection so the
// API response keeps the same flat + nested keys.
// ---------------------------------------------------------------------
const RESULT_INCLUDE = {
    student: {
        select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            universityRegNo: true,
            batchId: true,
            email: true,
            phone: true,
        },
    },
    exam: {
        select: {
            id: true,
            name: true,
            startDateBs: true,
            endDateBs: true,
            examTypeId: true,
            batchTermId: true,
            batchTerm: { select: { batch: { select: { id: true, name: true } } } },
        },
    },
    subjects: {
        where: { deletedAt: null },
        include: {
            gradeScale: {
                select: { id: true, grade: true, gradePoint: true },
            },
            examSubject: {
                select: {
                    id: true,
                    fullMarks: true,
                    passMarks: true,
                    batchTermSubjectId: true,
                    batchTermSubject: {
                        select: {
                            subject: { select: { id: true, name: true, code: true } },
                        },
                    },
                },
            },
        },
    },
};
const fixed = (value, digits) => (value == null ? null : value.toFixed(digits));
function studentName(student) {
    return [student.firstName, student.middleName, student.lastName]
        .filter((part) => Boolean(part && part.trim()))
        .join(" ");
}
/**
 * Converts the Prisma graph into the same shape the previous raw query
 * returned: decimals as fixed-scale strings and a few flattened convenience
 * fields (`studentName`, `examName`, `batchName`, `subjectName`).
 */
function shapeResult(result) {
    const subjects = [...result.subjects]
        .sort((a, b) => (a.examSubject.batchTermSubject.subject.name ?? "").localeCompare(b.examSubject.batchTermSubject.subject.name ?? ""))
        .map((subject) => {
        const meta = subject.examSubject.batchTermSubject.subject;
        return {
            id: subject.id,
            resultId: subject.resultId,
            examSubjectId: subject.examSubjectId,
            marksObtained: fixed(subject.marksObtained, 2),
            fullMarks: fixed(subject.fullMarks, 2),
            creditHour: fixed(subject.creditHour, 1),
            gradePoint: fixed(subject.gradePoint, 2),
            gradeScaleId: subject.gradeScaleId,
            subjectId: meta.id,
            subjectName: meta.name,
            subjectCode: meta.code,
            gradeScale: {
                id: subject.gradeScale.id,
                grade: subject.gradeScale.grade,
                gradePoint: fixed(subject.gradeScale.gradePoint, 2),
            },
            examSubject: {
                id: subject.examSubject.id,
                fullMarks: fixed(subject.examSubject.fullMarks, 2),
                passMarks: fixed(subject.examSubject.passMarks, 2),
                batchTermSubjectId: subject.examSubject.batchTermSubjectId,
            },
        };
    });
    const batch = result.exam.batchTerm.batch;
    return {
        id: result.id,
        studentId: result.studentId,
        examId: result.examId,
        totalMarks: fixed(result.totalMarks, 2),
        fullMarks: fixed(result.fullMarks, 2),
        percentage: fixed(result.percentage, 2),
        totalCreditHour: fixed(result.totalCreditHour, 1),
        gpa: fixed(result.gpa, 2),
        cgpa: fixed(result.cgpa, 2),
        isPassed: result.isPassed,
        submittedAt: result.submittedAt,
        approvedBy: result.approvedBy,
        approvedAt: result.approvedAt,
        publishedAt: result.publishedAt,
        remarks: result.remarks,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        createdBy: result.createdBy,
        updatedBy: result.updatedBy,
        deletedAt: result.deletedAt,
        status: result.status,
        studentName: studentName(result.student),
        examName: result.exam.name,
        batchName: batch?.name ?? null,
        subjectName: subjects.map((subject) => subject.subjectName).join(", "),
        student: {
            id: result.student.id,
            firstName: result.student.firstName,
            middleName: result.student.middleName,
            lastName: result.student.lastName,
            universityRegNo: result.student.universityRegNo,
            batchId: result.student.batchId,
            email: result.student.email,
            phone: result.student.phone,
        },
        exam: {
            id: result.exam.id,
            name: result.exam.name,
            startDateBs: result.exam.startDateBs,
            endDateBs: result.exam.endDateBs,
            examTypeId: result.exam.examTypeId,
            batchTermId: result.exam.batchTermId,
        },
        batch: batch ? { id: batch.id, name: batch.name } : null,
        subjects,
    };
}
async function findGradeScale(scales, percent, isAbsent) {
    if (isAbsent) {
        // Lowest available scale row counts as the fail grade for absent students
        return [...scales].sort((a, b) => Number(a.minPercent) - Number(b.minPercent))[0];
    }
    const match = scales.find((s) => percent >= Number(s.minPercent) && percent <= Number(s.maxPercent));
    if (match)
        return match;
    // Fallback: highest scale whose minPercent <= percent (covers scale gaps)
    const lower = [...scales]
        .filter((s) => percent > Number(s.maxPercent))
        .sort((a, b) => Number(b.minPercent) - Number(a.minPercent))[0];
    return lower ?? null;
}
async function computeResult(tx, studentId, examId) {
    const exam = await tx.exam.findFirst({
        where: { id: examId, deletedAt: null },
        include: {
            subjects: {
                where: { deletedAt: null },
                include: { batchTermSubject: { include: { subject: true } } },
            },
        },
    });
    if (!exam)
        throw new CustomError_1.CustomError("Exam not found or has been deleted", 404);
    if (!exam.subjects || exam.subjects.length === 0) {
        throw new CustomError_1.CustomError("Exam has no subjects", 422);
    }
    const [marks, scales] = await Promise.all([
        tx.examMark.findMany({
            where: { studentId, deletedAt: null, examSubject: { examId } },
            include: { examSubject: true },
        }),
        tx.gradeScale.findMany({ where: { isActive: true, deletedAt: null } }),
    ]);
    if (scales.length === 0)
        throw new CustomError_1.CustomError("No active grade scales configured", 500);
    const markBySubject = new Map(marks.map((mark) => [mark.examSubjectId, mark]));
    const missing = [];
    const rows = [];
    for (const subject of exam.subjects) {
        const mark = markBySubject.get(subject.id);
        if (!mark) {
            missing.push({
                examSubjectId: subject.id,
                subjectName: subject.batchTermSubject?.subject?.name ?? subject.id,
            });
            continue;
        }
        const fullMarks = Number(subject.fullMarks);
        const passMarks = Number(subject.passMarks);
        const creditHour = Number(subject.batchTermSubject.creditHour);
        const isAbsent = Boolean(mark.isAbsent);
        const obtained = isAbsent ? 0 : Number(mark.marksObtained ?? 0);
        const percent = fullMarks > 0 ? (obtained / fullMarks) * 100 : 0;
        const scale = await findGradeScale(scales, percent, isAbsent);
        if (!scale)
            throw new CustomError_1.CustomError("No grade scale matches this percentage", 500);
        const gradePoint = isAbsent ? 0 : Number(scale.gradePoint);
        rows.push({
            examSubjectId: subject.id,
            marksObtained: obtained,
            fullMarks,
            creditHour,
            gradeScaleId: scale.id,
            gradePoint,
            isPassedSubject: !isAbsent && obtained >= passMarks && Boolean(scale.isPassGrade),
        });
    }
    if (missing.length > 0) {
        throw new CustomError_1.ValidationError({
            missingMarks: missing.map((m) => `Missing mark for subject: ${m.subjectName}`),
        }, "Result cannot be computed — marks are missing for some subjects");
    }
    const totalMarks = rows.reduce((sum, r) => sum + r.marksObtained, 0);
    const fullMarks = rows.reduce((sum, r) => sum + r.fullMarks, 0);
    const totalCreditHour = rows.reduce((sum, r) => sum + r.creditHour, 0);
    const percentage = fullMarks > 0 ? round2((totalMarks / fullMarks) * 100) : 0;
    const gpa = totalCreditHour > 0
        ? round2(rows.reduce((sum, r) => sum + r.gradePoint * r.creditHour, 0) /
            totalCreditHour)
        : 0;
    const isPassed = rows.every((r) => r.isPassedSubject);
    return {
        totalMarks: round2(totalMarks),
        fullMarks: round2(fullMarks),
        percentage,
        totalCreditHour,
        gpa,
        isPassed,
        rows,
    };
}
/**
 * CGPA = credit-weighted GPA across the student's APPROVED/PUBLISHED results.
 * The result being computed only counts once it is APPROVED/PUBLISHED,
 * otherwise the projection is shown as null (per spec).
 */
async function computeCgpa(tx, studentId, currentResultId, currentGpa, currentCredit) {
    const approved = await tx.result.findMany({
        where: {
            studentId,
            status: { in: ["APPROVED", "PUBLISHED"] },
            deletedAt: null,
            ...(currentResultId ? { id: { not: currentResultId } } : {}),
        },
        select: { gpa: true, totalCreditHour: true },
    });
    let weighted = approved.reduce((sum, r) => sum + Number(r.gpa) * Number(r.totalCreditHour), 0);
    let credits = approved.reduce((sum, r) => sum + Number(r.totalCreditHour), 0);
    if (currentGpa !== undefined && currentCredit !== undefined) {
        weighted += currentGpa * currentCredit;
        credits += currentCredit;
    }
    return credits > 0 ? round2(weighted / credits) : null;
}
/** Rebuilds the Result header + ResultSubject snapshots from current marks. */
async function recomputeResult(tx, resultId, currentStatus) {
    const result = await tx.result.findFirst({
        where: { id: resultId, deletedAt: null },
    });
    if (!result)
        throw new CustomError_1.CustomError("Result not found", 404);
    const computed = await computeResult(tx, result.studentId, result.examId);
    const statusToCount = currentStatus ?? result.status;
    const cgpa = statusToCount === "APPROVED" || statusToCount === "PUBLISHED"
        ? await computeCgpa(tx, result.studentId, resultId, computed.gpa, computed.totalCreditHour)
        : await computeCgpa(tx, result.studentId, resultId);
    await tx.resultSubject.deleteMany({ where: { resultId } });
    if (computed.rows.length > 0) {
        await tx.resultSubject.createMany({
            data: computed.rows.map((r) => ({
                resultId,
                examSubjectId: r.examSubjectId,
                marksObtained: r.marksObtained,
                fullMarks: r.fullMarks,
                creditHour: r.creditHour,
                gradeScaleId: r.gradeScaleId,
                gradePoint: r.gradePoint,
            })),
        });
    }
    return tx.result.update({
        where: { id: resultId },
        data: {
            totalMarks: computed.totalMarks,
            fullMarks: computed.fullMarks,
            percentage: computed.percentage,
            totalCreditHour: computed.totalCreditHour,
            gpa: computed.gpa,
            cgpa,
            isPassed: computed.isPassed,
        },
    });
}
exports.ResultService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        if (query.status && !RESULT_STATUS_VALUES.includes(query.status)) {
            return { results: [], pagination: { page, limit, total: 0 } };
        }
        const where = { deletedAt: null };
        if (query.search) {
            where.OR = [
                {
                    student: {
                        OR: [
                            { firstName: { contains: query.search, mode: "insensitive" } },
                            { lastName: { contains: query.search, mode: "insensitive" } },
                        ],
                    },
                },
                { remarks: { contains: query.search, mode: "insensitive" } },
            ];
        }
        if (query.studentId)
            where.studentId = query.studentId;
        if (query.examId)
            where.examId = query.examId;
        if (query.status)
            where.status = query.status;
        const [results, total] = await Promise.all([
            prismaClient_1.prismaMain.result.findMany({
                where,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: RESULT_INCLUDE,
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.result.count({ where }),
        ]);
        return {
            results: results.map(shapeResult),
            pagination: { page, limit, total },
        };
    },
    async create(data, actor) {
        const student = await prismaClient_1.prismaMain.student.findFirst({
            where: { id: data.studentId, deletedAt: null },
            select: { id: true },
        });
        if (!student)
            throw new CustomError_1.CustomError("Student not found or has been deleted", 404);
        const exam = await prismaClient_1.prismaMain.exam.findFirst({
            where: { id: data.examId, deletedAt: null },
        });
        if (!exam)
            throw new CustomError_1.CustomError("Exam not found or has been deleted", 404);
        const status = data.status ?? "PENDING";
        const existing = await prismaClient_1.prismaMain.result.findFirst({
            where: {
                studentId: data.studentId,
                examId: data.examId,
                deletedAt: null,
            },
        });
        if (existing)
            throw new CustomError_1.CustomError("A result already exists for this student and exam", 409);
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            const computed = await computeResult(tx, data.studentId, data.examId);
            const cgpa = await computeCgpa(tx, data.studentId);
            const result = await tx.result.create({
                data: {
                    studentId: data.studentId,
                    examId: data.examId,
                    totalMarks: computed.totalMarks,
                    fullMarks: computed.fullMarks,
                    percentage: computed.percentage,
                    totalCreditHour: computed.totalCreditHour,
                    gpa: computed.gpa,
                    cgpa,
                    isPassed: computed.isPassed,
                    status,
                    remarks: data.remarks ?? null,
                    submittedAt: status === "PENDING" ? new Date() : null,
                    createdBy: actor.userId,
                },
            });
            if (computed.rows.length > 0) {
                await tx.resultSubject.createMany({
                    data: computed.rows.map((r) => ({
                        resultId: result.id,
                        examSubjectId: r.examSubjectId,
                        marksObtained: r.marksObtained,
                        fullMarks: r.fullMarks,
                        creditHour: r.creditHour,
                        gradeScaleId: r.gradeScaleId,
                        gradePoint: r.gradePoint,
                    })),
                });
            }
            const created = await tx.result.findFirstOrThrow({
                where: { id: result.id },
                include: RESULT_INCLUDE,
            });
            return shapeResult(created);
        });
    },
    async getById(id) {
        const result = await prismaClient_1.prismaMain.result.findFirst({
            where: { id, deletedAt: null },
            include: RESULT_INCLUDE,
        });
        if (!result)
            throw new CustomError_1.CustomError("Result not found", 404);
        return shapeResult(result);
    },
    async update(id, data, actor) {
        const existing = await prismaClient_1.prismaMain.result.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Result not found", 404);
        if (existing.status === "PUBLISHED") {
            throw new CustomError_1.CustomError("Published results are immutable — corrections require a new result revision", 409);
        }
        // Only remarks editable via PATCH; all computed fields stay server-owned
        const updated = await prismaClient_1.prismaMain.result.update({
            where: { id },
            data: {
                ...(data.remarks !== undefined ? { remarks: data.remarks } : {}),
                updatedBy: actor.userId,
            },
            include: RESULT_INCLUDE,
        });
        return shapeResult(updated);
    },
    /**
     * State transition subset:
     * DRAFT/PENDING -> APPROVED|REJECTED ; APPROVED -> PUBLISHED ; REJECTED -> PENDING.
     * Every transition recomputes totals/GPA/CGPA from the latest marks first.
     */
    async transition(id, to, actor) {
        const existing = await prismaClient_1.prismaMain.result.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Result not found", 404);
        const allowed = ALLOWED_TRANSITIONS[existing.status] ?? [];
        if (!allowed.includes(to)) {
            throw new CustomError_1.CustomError(`Invalid result transition from ${existing.status} to ${to}`, 409);
        }
        // APPROVED/PUBLISHED/REJECTED transitions are a principal action
        if ((to === "APPROVED" || to === "PUBLISHED" || to === "REJECTED") &&
            actor.role !== "PRINCIPAL" &&
            actor.role !== "ADMIN") {
            throw new CustomError_1.CustomError(`Only PRINCIPAL/ADMIN can move a result to ${to}`, 403);
        }
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            const recomputed = await recomputeResult(tx, id, to);
            const patch = {
                status: to,
                updatedBy: actor.userId,
            };
            if (to === "PENDING")
                patch.submittedAt = new Date();
            if (to === "APPROVED") {
                patch.approvedBy = actor.userId ?? null;
                patch.approvedAt = new Date();
            }
            if (to === "PUBLISHED")
                patch.publishedAt = new Date();
            const updated = await tx.result.update({
                where: { id },
                data: { ...patch, cgpa: recomputed.cgpa },
                include: RESULT_INCLUDE,
            });
            return shapeResult(updated);
        });
    },
    /** Bulk approve per exam (principal): PENDING results only; missing-marks results are reported, not approved. */
    async bulkApproveExam(examId, actor) {
        const exam = await prismaClient_1.prismaMain.exam.findFirst({
            where: { id: examId, deletedAt: null },
        });
        if (!exam)
            throw new CustomError_1.CustomError("Exam not found", 404);
        const pending = await prismaClient_1.prismaMain.result.findMany({
            where: { examId, status: "PENDING", deletedAt: null },
            select: { id: true },
        });
        const approved = [];
        const failed = [];
        for (const row of pending) {
            try {
                await exports.ResultService.transition(row.id, "APPROVED", actor);
                approved.push(row.id);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Failed to approve result";
                failed.push({ resultId: row.id, message });
            }
        }
        return { examId, approved, failed };
    },
    /** Recompute entry point (also used automatically on REJECTED->PENDING). */
    async recompute(id, actor) {
        const existing = await prismaClient_1.prismaMain.result.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Result not found", 404);
        if (existing.status === "PUBLISHED") {
            throw new CustomError_1.CustomError("Published results are immutable", 409);
        }
        await prismaClient_1.prismaMain.$transaction(async (tx) => {
            await recomputeResult(tx, id);
        });
        const result = await prismaClient_1.prismaMain.result.findFirst({
            where: { id },
            include: RESULT_INCLUDE,
        });
        if (!result)
            throw new CustomError_1.CustomError("Result not found", 404);
        return shapeResult(result);
    },
    async delete(id, actor) {
        const existing = await prismaClient_1.prismaMain.result.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Result not found", 404);
        if (existing.status === "PUBLISHED") {
            throw new CustomError_1.CustomError("Published results are immutable and cannot be deleted", 409);
        }
        await prismaClient_1.prismaMain.result.update({
            where: { id },
            data: { deletedAt: new Date(), updatedBy: actor.userId },
        });
        return null;
    },
};
