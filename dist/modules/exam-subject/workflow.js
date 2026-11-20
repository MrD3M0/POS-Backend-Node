"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamSubjectWorkflow = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
const service_1 = require("@/modules/result/service");
const SUBMIT_FROM = new Set(["DRAFT", "REJECTED", "PENDING"]);
function round1(value) {
    return Math.round(value * 10) / 10;
}
function fullName(parts) {
    if (!parts)
        return null;
    const name = [parts.firstName, parts.middleName, parts.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
    return name || null;
}
async function resolveTeacherId(userId) {
    if (!userId)
        throw new CustomError_1.CustomError("Unauthorized", 401);
    const teacher = await prismaClient_1.prismaMain.teacher.findFirst({
        where: { deletedAt: null, employee: { userId, deletedAt: null } },
        select: { id: true },
    });
    if (!teacher) {
        throw new CustomError_1.CustomError("No teacher profile is linked to this account", 403);
    }
    return teacher.id;
}
const GROUP_INCLUDE = {
    exam: {
        select: {
            id: true,
            name: true,
            batchTermId: true,
            examType: { select: { id: true, name: true } },
        },
    },
    batchTermSubject: {
        select: {
            id: true,
            creditHour: true,
            subject: { select: { id: true, code: true, name: true } },
            batchTerm: {
                select: {
                    id: true,
                    name: true,
                    termNumber: true,
                    batch: {
                        select: {
                            id: true,
                            name: true,
                            course: { select: { id: true, name: true } },
                        },
                    },
                },
            },
            assignments: {
                where: { deletedAt: null },
                select: {
                    id: true,
                    teacherId: true,
                    teacher: {
                        select: {
                            employee: {
                                select: {
                                    firstName: true,
                                    middleName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};
exports.ExamSubjectWorkflow = {
    /** Grouped approval list: one row per Batch + Term + Subject (ExamSubject). */
    async groups(query, actor) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 20);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const where = { deletedAt: null };
        const and = [];
        if (query.batchId)
            and.push({ batchTermSubject: { batchTerm: { batchId: query.batchId } } });
        if (query.termId)
            and.push({ batchTermSubject: { batchTermId: query.termId } });
        if (query.subjectId)
            and.push({ batchTermSubject: { subjectId: query.subjectId } });
        if (query.examId)
            and.push({ examId: query.examId });
        if (query.status)
            and.push({ status: query.status });
        if (query.search) {
            and.push({
                OR: [
                    { exam: { name: { contains: query.search, mode: "insensitive" } } },
                    {
                        batchTermSubject: {
                            subject: { name: { contains: query.search, mode: "insensitive" } },
                        },
                    },
                ],
            });
        }
        if (actor.role === "TEACHER") {
            const teacherId = await resolveTeacherId(actor.userId);
            and.push({
                batchTermSubject: {
                    assignments: { some: { teacherId, deletedAt: null } },
                },
            });
        }
        if (and.length)
            where.AND = and;
        const [rows, total] = await Promise.all([
            prismaClient_1.prismaMain.examSubject.findMany({
                where,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: GROUP_INCLUDE,
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.examSubject.count({ where }),
        ]);
        const studentCountByBatch = new Map();
        const studentsInBatch = (batchId) => {
            if (!studentCountByBatch.has(batchId)) {
                studentCountByBatch.set(batchId, prismaClient_1.prismaMain.student.count({ where: { batchId, deletedAt: null } }));
            }
            return studentCountByBatch.get(batchId);
        };
        const data = await Promise.all(rows.map(async (row) => {
            const batch = row.batchTermSubject?.batchTerm?.batch;
            const term = row.batchTermSubject?.batchTerm;
            const subject = row.batchTermSubject?.subject;
            const fullMarks = Number(row.fullMarks);
            const passMarks = Number(row.passMarks);
            const [studentsCount, marksEntered, absentCount, passCount] = await Promise.all([
                batch?.id ? studentsInBatch(batch.id) : Promise.resolve(0),
                prismaClient_1.prismaMain.examMark.count({
                    where: { examSubjectId: row.id, deletedAt: null },
                }),
                prismaClient_1.prismaMain.examMark.count({
                    where: { examSubjectId: row.id, deletedAt: null, isAbsent: true },
                }),
                prismaClient_1.prismaMain.examMark.count({
                    where: {
                        examSubjectId: row.id,
                        deletedAt: null,
                        isAbsent: false,
                        marksObtained: { gte: passMarks },
                    },
                }),
            ]);
            const teacher = row.batchTermSubject?.assignments?.[0]?.teacher?.employee;
            return {
                id: row.id,
                examId: row.examId,
                examName: row.exam?.name ?? "—",
                examTypeName: row.exam?.examType?.name ?? null,
                batchId: batch?.id ?? "",
                batchName: batch?.name ?? "—",
                termId: term?.id ?? "",
                termName: term?.name ?? "—",
                termNumber: term?.termNumber ?? null,
                subjectId: subject?.id ?? "",
                subjectName: subject?.name ?? "—",
                subjectCode: subject?.code ?? null,
                status: row.status ?? "DRAFT",
                rejectionReason: row.rejectionReason ?? null,
                submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
                approvedAt: row.approvedAt ? row.approvedAt.toISOString() : null,
                teacherName: fullName(teacher),
                fullMarks,
                passMarks,
                studentsCount,
                marksEntered,
                absentCount,
                passCount,
                passPercent: marksEntered > 0 ? round1((passCount / marksEntered) * 100) : 0,
            };
        }));
        return { data, pagination: { page, limit, total } };
    },
    /** Teacher submits the marks of one subject. All students must have a mark. */
    async submit(id, actor) {
        const item = await prismaClient_1.prismaMain.examSubject.findFirst({
            where: { id, deletedAt: null },
            include: {
                exam: {
                    select: {
                        id: true,
                        name: true,
                        batchTerm: { select: { id: true, batchId: true } },
                    },
                },
                batchTermSubject: {
                    select: {
                        id: true,
                        subject: { select: { name: true } },
                        assignments: {
                            where: { deletedAt: null },
                            select: { teacherId: true },
                        },
                    },
                },
            },
        });
        if (!item)
            throw new CustomError_1.CustomError("Exam subject not found", 404);
        const currentStatus = item.status ?? "DRAFT";
        if (currentStatus === "APPROVED") {
            throw new CustomError_1.CustomError("This subject is already approved and cannot be changed", 409);
        }
        if (currentStatus === "PENDING") {
            // Re-submitting a pending subject is a no-op — the principal is reviewing it.
            return item;
        }
        if (!SUBMIT_FROM.has(currentStatus)) {
            throw new CustomError_1.CustomError(`Cannot submit a subject in ${currentStatus} state`, 409);
        }
        if (actor.role === "TEACHER") {
            const teacherId = await resolveTeacherId(actor.userId);
            const owns = item.batchTermSubject?.assignments?.some((assignment) => assignment.teacherId === teacherId);
            if (!owns) {
                throw new CustomError_1.CustomError("You can only submit marks for the subjects you teach", 403);
            }
        }
        const batchId = item.exam?.batchTerm?.batchId;
        if (!batchId)
            throw new CustomError_1.CustomError("Exam has no batch/term", 422);
        const [students, marks] = await Promise.all([
            prismaClient_1.prismaMain.student.findMany({
                where: { batchId, deletedAt: null },
                select: { id: true },
            }),
            prismaClient_1.prismaMain.examMark.findMany({
                where: { examSubjectId: id, deletedAt: null },
                select: { studentId: true },
            }),
        ]);
        if (students.length === 0) {
            throw new CustomError_1.CustomError("This batch has no students", 422);
        }
        const marked = new Set(marks.map((mark) => mark.studentId));
        const missing = students.filter((student) => !marked.has(student.id));
        if (missing.length > 0) {
            throw new CustomError_1.ValidationError({
                missingMarks: [
                    `${missing.length} of ${students.length} students have no mark (enter a mark or mark them Absent)`,
                ],
            }, "Cannot submit marks: every student needs a mark");
        }
        const updated = await prismaClient_1.prismaMain.examSubject.update({
            where: { id },
            data: {
                status: "PENDING",
                submittedAt: new Date(),
                submittedBy: actor.userId ?? null,
                approvedBy: null,
                approvedAt: null,
                rejectionReason: null,
                updatedBy: actor.userId ?? null,
            },
            include: GROUP_INCLUDE,
        });
        return updated;
    },
    /**
     * Approve or reject one or more subjects in ONE transaction.
     * Filters: batchId + termId (+ subjectId / examId). Rejection needs a reason.
     */
    async bulkReview(input, actor) {
        if (actor.role !== "PRINCIPAL" && actor.role !== "ADMIN") {
            throw new CustomError_1.CustomError("Only PRINCIPAL/ADMIN can review results", 403);
        }
        const reason = input.reason?.trim();
        if (input.action === "REJECT" && !reason) {
            throw new CustomError_1.ValidationError({ reason: ["A rejection reason is required"] }, "Rejection needs a reason");
        }
        const where = {
            deletedAt: null,
            status: "PENDING",
            batchTermSubject: {
                batchTermId: input.termId,
                batchTerm: { batchId: input.batchId },
            },
        };
        if (input.subjectId) {
            where.batchTermSubject.subjectId =
                input.subjectId;
        }
        if (input.examId)
            where.examId = input.examId;
        const pending = await prismaClient_1.prismaMain.examSubject.findMany({
            where,
            select: { id: true },
        });
        if (pending.length === 0) {
            throw new CustomError_1.CustomError("No pending subjects match this Batch + Term selection", 404);
        }
        const ids = pending.map((row) => row.id);
        const updated = await prismaClient_1.prismaMain.$transaction(async (tx) => {
            const patch = input.action === "APPROVE"
                ? {
                    status: "APPROVED",
                    approvedBy: actor.userId ?? null,
                    approvedAt: new Date(),
                    rejectionReason: null,
                    updatedBy: actor.userId ?? null,
                }
                : {
                    status: "REJECTED",
                    approvedBy: actor.userId ?? null,
                    approvedAt: new Date(),
                    rejectionReason: reason ?? null,
                    updatedBy: actor.userId ?? null,
                };
            await tx.examSubject.updateMany({
                where: { id: { in: ids } },
                data: patch,
            });
            return ids.length;
        });
        return { action: input.action, updated };
    },
    /**
     * Publish a Batch + Term (optionally one exam) in ONE transaction.
     * Every subject must be APPROVED. Results are (re)computed from the marks
     * and flipped to PUBLISHED with publishedAt set.
     */
    async publish(input, actor) {
        if (actor.role !== "PRINCIPAL" && actor.role !== "ADMIN") {
            throw new CustomError_1.CustomError("Only PRINCIPAL/ADMIN can publish results", 403);
        }
        const term = await prismaClient_1.prismaMain.batchTerm.findFirst({
            where: { id: input.termId, batchId: input.batchId, deletedAt: null },
            select: { id: true, name: true, batchId: true },
        });
        if (!term)
            throw new CustomError_1.CustomError("Term not found for this batch", 404);
        const exams = await prismaClient_1.prismaMain.exam.findMany({
            where: {
                batchTermId: input.termId,
                deletedAt: null,
                ...(input.examId ? { id: input.examId } : {}),
            },
            select: { id: true, name: true },
        });
        if (exams.length === 0) {
            throw new CustomError_1.CustomError("This term has no exams yet", 422);
        }
        const examIds = exams.map((exam) => exam.id);
        const subjects = await prismaClient_1.prismaMain.examSubject.findMany({
            where: { examId: { in: examIds }, deletedAt: null },
            select: { id: true, examId: true, status: true },
        });
        if (subjects.length === 0) {
            throw new CustomError_1.CustomError("This term has no exam subjects yet", 422);
        }
        const notApproved = subjects.filter((subject) => subject.status !== "APPROVED");
        if (notApproved.length > 0) {
            throw new CustomError_1.CustomError(`Cannot publish: ${notApproved.length} of ${subjects.length} subject(s) are not approved`, 409);
        }
        const students = await prismaClient_1.prismaMain.student.findMany({
            where: { batchId: input.batchId, deletedAt: null },
            select: { id: true },
        });
        if (students.length === 0) {
            throw new CustomError_1.CustomError("This batch has no students", 422);
        }
        const summary = await prismaClient_1.prismaMain.$transaction(async (tx) => {
            let created = 0;
            let updated = 0;
            const upsertedResultIds = [];
            const affectedStudents = new Set();
            for (const exam of exams) {
                for (const student of students) {
                    const computed = await (0, service_1.computeResult)(tx, student.id, exam.id);
                    affectedStudents.add(student.id);
                    const existing = await tx.result.findFirst({
                        where: { studentId: student.id, examId: exam.id, deletedAt: null },
                    });
                    let resultId;
                    if (existing) {
                        resultId = existing.id;
                        await tx.resultSubject.deleteMany({ where: { resultId } });
                        if (computed.rows.length > 0) {
                            await tx.resultSubject.createMany({
                                data: computed.rows.map((row) => ({
                                    resultId,
                                    examSubjectId: row.examSubjectId,
                                    marksObtained: row.marksObtained,
                                    fullMarks: row.fullMarks,
                                    creditHour: row.creditHour,
                                    gradeScaleId: row.gradeScaleId,
                                    gradePoint: row.gradePoint,
                                })),
                            });
                        }
                        await tx.result.update({
                            where: { id: resultId },
                            data: {
                                totalMarks: computed.totalMarks,
                                fullMarks: computed.fullMarks,
                                percentage: computed.percentage,
                                totalCreditHour: computed.totalCreditHour,
                                gpa: computed.gpa,
                                isPassed: computed.isPassed,
                                status: "PUBLISHED",
                                submittedAt: existing.submittedAt ?? new Date(),
                                approvedBy: actor.userId ?? null,
                                approvedAt: new Date(),
                                publishedAt: new Date(),
                                updatedBy: actor.userId ?? null,
                            },
                        });
                        updated += 1;
                    }
                    else {
                        const createdRow = await tx.result.create({
                            data: {
                                studentId: student.id,
                                examId: exam.id,
                                totalMarks: computed.totalMarks,
                                fullMarks: computed.fullMarks,
                                percentage: computed.percentage,
                                totalCreditHour: computed.totalCreditHour,
                                gpa: computed.gpa,
                                cgpa: null,
                                isPassed: computed.isPassed,
                                status: "PUBLISHED",
                                submittedAt: new Date(),
                                approvedBy: actor.userId ?? null,
                                approvedAt: new Date(),
                                publishedAt: new Date(),
                                createdBy: actor.userId ?? null,
                            },
                        });
                        resultId = createdRow.id;
                        if (computed.rows.length > 0) {
                            await tx.resultSubject.createMany({
                                data: computed.rows.map((row) => ({
                                    resultId,
                                    examSubjectId: row.examSubjectId,
                                    marksObtained: row.marksObtained,
                                    fullMarks: row.fullMarks,
                                    creditHour: row.creditHour,
                                    gradeScaleId: row.gradeScaleId,
                                    gradePoint: row.gradePoint,
                                })),
                            });
                        }
                        created += 1;
                    }
                    upsertedResultIds.push(resultId);
                }
            }
            // Recompute CGPA once per student now that every result is published.
            for (const studentId of affectedStudents) {
                const rows = await tx.result.findMany({
                    where: {
                        studentId,
                        status: { in: ["APPROVED", "PUBLISHED"] },
                        deletedAt: null,
                    },
                    select: { gpa: true, totalCreditHour: true },
                });
                const weighted = rows.reduce((sum, row) => sum + Number(row.gpa) * Number(row.totalCreditHour), 0);
                const credits = rows.reduce((sum, row) => sum + Number(row.totalCreditHour), 0);
                const cgpa = credits > 0 ? Math.round((weighted / credits) * 100) / 100 : null;
                await tx.result.updateMany({
                    where: { studentId, deletedAt: null },
                    data: { cgpa },
                });
            }
            return {
                exams: exams.length,
                students: students.length,
                results: upsertedResultIds.length,
                created,
                updated,
            };
        });
        return { batchId: input.batchId, term, ...summary };
    },
};
