"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchTermSubjectService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
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
};
exports.BatchTermSubjectService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {
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
            prismaClient_1.prismaMain.batchTermSubject.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    ...BATCH_TERM_SUBJECT_INCLUDE,
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.batchTermSubject.count({ where: whereClause }),
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
    async create(data, userId) {
        // Validate that BatchTerm exists and is not soft-deleted
        const batchTerm = await prismaClient_1.prismaMain.batchTerm.findFirst({
            where: { id: data.batchTermId, deletedAt: null },
        });
        if (!batchTerm) {
            throw new CustomError_1.CustomError("BatchTerm not found or has been deleted", 404);
        }
        // Validate that Subject exists and is not soft-deleted
        const subject = await prismaClient_1.prismaMain.subject.findFirst({
            where: { id: data.subjectId, deletedAt: null },
        });
        if (!subject) {
            throw new CustomError_1.CustomError("Subject not found or has been deleted", 404);
        }
        // Check duplicate combination of batchTerm + subject
        const existing = await prismaClient_1.prismaMain.batchTermSubject.findFirst({
            where: {
                batchTermId: data.batchTermId,
                subjectId: data.subjectId,
                deletedAt: null,
            },
        });
        if (existing) {
            throw new CustomError_1.CustomError(`Subject ${subject.code} is already assigned to this batch term`, 409);
        }
        try {
            const batchTermSubject = await prismaClient_1.prismaMain.batchTermSubject.create({
                data: {
                    ...data,
                    createdBy: userId,
                },
                include: {
                    ...BATCH_TERM_SUBJECT_INCLUDE,
                },
            });
            return batchTermSubject;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError(`Subject ${subject.code} is already assigned to this batch term`, 409);
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
    async bulkCreate(data, userId) {
        const batchTerm = await prismaClient_1.prismaMain.batchTerm.findFirst({
            where: { id: data.batchTermId, deletedAt: null },
        });
        if (!batchTerm) {
            throw new CustomError_1.CustomError("BatchTerm not found or has been deleted", 404);
        }
        const requested = data.subjects;
        const subjectIds = [...new Set(requested.map((row) => row.subjectId))];
        // Same subject twice in one request.
        if (subjectIds.length !== requested.length) {
            const seen = new Set();
            const duplicated = [];
            for (const row of requested) {
                if (seen.has(row.subjectId))
                    duplicated.push(row.subjectId);
                seen.add(row.subjectId);
            }
            const codes = await prismaClient_1.prismaMain.subject.findMany({
                where: { id: { in: duplicated }, deletedAt: null },
                select: { code: true },
            });
            const label = codes.map((row) => row.code).join(", ");
            throw new CustomError_1.CustomError(`Duplicate subject${duplicated.length > 1 ? "s" : ""} in the request${label ? `: ${label}` : ""}. Keep one row per subject.`, 400);
        }
        const subjects = await prismaClient_1.prismaMain.subject.findMany({
            where: { id: { in: subjectIds }, deletedAt: null },
            select: { id: true, code: true },
        });
        const subjectById = new Map(subjects.map((row) => [row.id, row]));
        // Unknown / soft-deleted subjects.
        const missing = subjectIds
            .filter((id) => !subjectById.has(id))
            .map((id) => id.slice(0, 8));
        if (missing.length > 0) {
            throw new CustomError_1.CustomError(`Subject${missing.length > 1 ? "s" : ""} not found or deleted: ${missing.join(", ")}`, 404);
        }
        // Already assigned to this term (active rows only).
        const existing = await prismaClient_1.prismaMain.batchTermSubject.findMany({
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
            throw new CustomError_1.CustomError(`Subject${existing.length > 1 ? "s" : ""} already assigned to this batch term: ${codes}. Refresh the list — those subjects are now marked as assigned.`, 409);
        }
        const batchTermSubjects = await prismaClient_1.prismaMain.$transaction(async (tx) => {
            const rows = [];
            for (const row of requested) {
                rows.push(await tx.batchTermSubject.create({
                    data: {
                        batchTermId: data.batchTermId,
                        subjectId: row.subjectId,
                        creditHour: row.creditHour,
                        isElective: row.isElective,
                        createdBy: userId,
                    },
                    include: { ...BATCH_TERM_SUBJECT_INCLUDE },
                }));
            }
            return rows;
        });
        return { created: batchTermSubjects.length, batchTermSubjects };
    },
    async getById(id) {
        const batchTermSubject = await prismaClient_1.prismaMain.batchTermSubject.findFirst({
            where: { id, deletedAt: null },
            include: {
                subject: true,
                assignments: true,
                examSubjects: true,
            },
        });
        if (!batchTermSubject) {
            throw new CustomError_1.CustomError("BatchTermSubject not found", 404);
        }
        return batchTermSubject;
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.batchTermSubject.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("BatchTermSubject not found", 404);
        }
        // Validate batchTerm if changed
        if (data.batchTermId && data.batchTermId !== existing.batchTermId) {
            const batchTerm = await prismaClient_1.prismaMain.batchTerm.findFirst({
                where: { id: data.batchTermId, deletedAt: null },
            });
            if (!batchTerm) {
                throw new CustomError_1.CustomError("BatchTerm not found or has been deleted", 404);
            }
        }
        // Validate subject if changed
        if (data.subjectId && data.subjectId !== existing.subjectId) {
            const subject = await prismaClient_1.prismaMain.subject.findFirst({
                where: { id: data.subjectId, deletedAt: null },
            });
            if (!subject) {
                throw new CustomError_1.CustomError("Subject not found or has been deleted", 404);
            }
        }
        // Per-batch edit guard: syllabus edits are scoped to one batch.
        // (a) A row may not be moved to a BatchTerm of a different batch.
        // (b) Once referenced by a teaching assignment or exam subject, the
        //     batchTerm/subject identity is frozen (creditHour/isElective only).
        if (data.batchTermId && data.batchTermId !== existing.batchTermId) {
            const [oldTerm, newTerm] = await Promise.all([
                prismaClient_1.prismaMain.batchTerm.findFirst({ where: { id: existing.batchTermId } }),
                prismaClient_1.prismaMain.batchTerm.findFirst({
                    where: { id: data.batchTermId, deletedAt: null },
                }),
            ]);
            if (newTerm && oldTerm && newTerm.batchId !== oldTerm.batchId) {
                throw new CustomError_1.CustomError("BatchTermSubject cannot be moved to a BatchTerm of a different batch (syllabus edits are per-batch)", 409);
            }
        }
        const identityChanged = (data.batchTermId && data.batchTermId !== existing.batchTermId) ||
            (data.subjectId && data.subjectId !== existing.subjectId);
        if (identityChanged) {
            const [assignment, examSubject] = await Promise.all([
                prismaClient_1.prismaMain.teachingAssignment.findFirst({
                    where: { batchTermSubjectId: id, deletedAt: null },
                }),
                prismaClient_1.prismaMain.examSubject.findFirst({
                    where: { batchTermSubjectId: id, deletedAt: null },
                }),
            ]);
            if (assignment || examSubject) {
                throw new CustomError_1.CustomError("This batch term subject is referenced by a teaching assignment or exam subject and cannot change batch term or subject", 409);
            }
        }
        try {
            const updated = await prismaClient_1.prismaMain.batchTermSubject.update({
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
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("This subject is already assigned to this batch term", 409);
            }
            throw error;
        }
    },
    async copy(fromBatchTermId, toBatchTermId, userId) {
        if (!fromBatchTermId || !toBatchTermId)
            throw new CustomError_1.CustomError("fromBatchTermId and toBatchTermId are required", 400);
        if (fromBatchTermId === toBatchTermId)
            throw new CustomError_1.CustomError("Source and target term must be different", 400);
        const [fromTerm, toTerm] = await Promise.all([
            prismaClient_1.prismaMain.batchTerm.findFirst({
                where: { id: fromBatchTermId, deletedAt: null },
            }),
            prismaClient_1.prismaMain.batchTerm.findFirst({
                where: { id: toBatchTermId, deletedAt: null },
            }),
        ]);
        if (!fromTerm)
            throw new CustomError_1.CustomError("Source batch term not found", 404);
        if (!toTerm)
            throw new CustomError_1.CustomError("Target batch term not found", 404);
        const sourceRows = await prismaClient_1.prismaMain.batchTermSubject.findMany({
            where: { batchTermId: fromBatchTermId, deletedAt: null },
            select: { subjectId: true, creditHour: true, isElective: true },
        });
        if (sourceRows.length === 0)
            throw new CustomError_1.CustomError("Source term has no subjects to copy", 409);
        const results = [];
        for (const row of sourceRows) {
            const exists = await prismaClient_1.prismaMain.batchTermSubject.findFirst({
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
            await prismaClient_1.prismaMain.batchTermSubject.create({
                data: {
                    batchTermId: toBatchTermId,
                    subjectId: row.subjectId,
                    creditHour: row.creditHour,
                    isElective: row.isElective,
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
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.batchTermSubject.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("BatchTermSubject not found", 404);
        }
        // Report exactly what is blocking removal so the admin knows what to
        // unlink first (teaching assignments, exam subjects, attendance sessions).
        const [assignmentCount, examSubjectCount, sessionCount] = await Promise.all([
            prismaClient_1.prismaMain.teachingAssignment.count({
                where: { batchTermSubjectId: id, deletedAt: null },
            }),
            prismaClient_1.prismaMain.examSubject.count({
                where: { batchTermSubjectId: id, deletedAt: null },
            }),
            prismaClient_1.prismaMain.attendanceSession.count({
                where: {
                    deletedAt: null,
                    teachingAssignment: { batchTermSubjectId: id },
                },
            }),
        ]);
        const linked = [];
        if (assignmentCount > 0)
            linked.push(`${assignmentCount} teaching assignment${assignmentCount > 1 ? "s" : ""}`);
        if (examSubjectCount > 0)
            linked.push(`${examSubjectCount} exam subject${examSubjectCount > 1 ? "s" : ""}`);
        if (sessionCount > 0)
            linked.push(`${sessionCount} attendance session${sessionCount > 1 ? "s" : ""}`);
        if (linked.length > 0) {
            throw new CustomError_1.CustomError(`This subject cannot be removed because it is still linked to: ${linked.join(", ")}. Remove those links first.`, 409);
        }
        await prismaClient_1.prismaMain.batchTermSubject.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
};
