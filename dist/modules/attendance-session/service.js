"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceSessionService = void 0;
exports.applyLazyLock = applyLazyLock;
exports.assertSessionWritableByLock = assertSessionWritableByLock;
exports.assertNoFutureDate = assertNoFutureDate;
exports.getRosterStudentIds = getRosterStudentIds;
exports.fillRosterDefaultPresent = fillRosterDefaultPresent;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
const settings_1 = require("@/lib/settings");
const bs_date_1 = require("@/utils/bs-date");
const audit_1 = require("@/lib/audit");
// NOTE: avoid including `records` via Prisma on legacy normalized DBs where
// student_attendances uses statusId (not enum `status`). Roster is loaded separately.
// Legacy DB compat: avoid `course` (courses.system vs courseSystemId drift).
const SESSION_INCLUDE = {
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
                        include: {
                            batch: { select: { id: true, name: true, courseId: true } },
                        },
                    },
                },
            },
        },
    },
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
    period: true,
};
async function getRosterStudents(assignmentId) {
    const assignment = await prismaClient_1.prismaMain.teachingAssignment.findFirst({
        where: { id: assignmentId, deletedAt: null },
        select: {
            batchTermSubject: {
                select: { batchTerm: { select: { batchId: true } } },
            },
        },
    });
    if (!assignment)
        return [];
    const batchId = assignment.batchTermSubject.batchTerm.batchId;
    return prismaClient_1.prismaMain.student.findMany({
        where: {
            batchId,
            approvalStatus: "APPROVED",
            status: "ACTIVE",
            deletedAt: null,
        },
        select: {
            id: true,
            universityRegNo: true,
            firstName: true,
            middleName: true,
            lastName: true,
        },
        orderBy: [{ universityRegNo: "asc" }, { firstName: "asc" }],
    });
}
async function getRosterStudentIdsCompat(assignmentId) {
    const students = await getRosterStudents(assignmentId);
    return students.map((s) => s.id);
}
async function fillRosterDefaultPresentCompat(sessionId, excludeIds = new Set(), userId) {
    const session = await prismaClient_1.prismaMain.attendanceSession.findFirst({
        where: { id: sessionId, deletedAt: null },
        select: { teachingAssignmentId: true },
    });
    if (!session)
        throw new CustomError_1.CustomError("Attendance session not found", 404);
    const rosterIds = await getRosterStudentIdsCompat(session.teachingAssignmentId);
    const toCreate = rosterIds.filter((id) => !excludeIds.has(id));
    if (toCreate.length === 0)
        return;
    await prismaClient_1.prismaMain.studentAttendance.createMany({
        data: toCreate.map((studentId) => ({
            sessionId,
            studentId,
            status: "PRESENT",
            createdBy: userId ?? null,
        })),
        skipDuplicates: true,
    });
}
/**
 * Persists per-student statuses for a session (one transaction).
 */
async function saveSessionRecords(tx, sessionId, records, userId) {
    if (records.length === 0)
        return;
    for (const record of records) {
        await tx.studentAttendance.upsert({
            where: {
                sessionId_studentId: { sessionId, studentId: record.studentId },
            },
            create: {
                sessionId,
                studentId: record.studentId,
                status: record.status,
                remarks: record.remarks ?? null,
                createdBy: userId,
            },
            update: {
                status: record.status,
                remarks: record.remarks ?? null,
                deletedAt: null,
                updatedBy: userId,
            },
        });
    }
}
async function getTeacherIdForUser(userId) {
    if (!userId)
        return null;
    const teacher = await prismaClient_1.prismaMain.teacher.findFirst({
        where: { deletedAt: null, employee: { userId, deletedAt: null } },
        select: { id: true },
    });
    return teacher?.id ?? null;
}
async function applyLazyLock(session) {
    if (session.isLocked)
        return true;
    try {
        const editHours = await (0, settings_1.getAttendanceEditHours)();
        const ageHours = (Date.now() - new Date(session.createdAt).getTime()) / 3_600_000;
        if (ageHours > editHours) {
            await prismaClient_1.prismaMain.attendanceSession.update({
                where: { id: session.id },
                data: { isLocked: true, lockedAt: new Date() },
            });
            return true;
        }
    }
    catch {
        // best-effort
    }
    return false;
}
async function assertSessionWritableByLock(session, role) {
    if (role === "ADMIN" || role === "PRINCIPAL")
        return;
    const locked = session.isLocked || (await applyLazyLock(session));
    if (locked) {
        throw new CustomError_1.CustomError("This attendance session is locked (edit window passed). Only PRINCIPAL/ADMIN can unlock.", 423);
    }
}
function assertNoFutureDate(dateBs) {
    const today = (0, bs_date_1.todayBs)();
    if (today && dateBs > today) {
        throw new CustomError_1.CustomError(`Cannot mark attendance for future date ${dateBs} (today is ${today})`, 400);
    }
}
async function getRosterStudentIds(assignmentId) {
    return getRosterStudentIdsCompat(assignmentId);
}
async function fillRosterDefaultPresent(sessionId, excludeIds = new Set(), userId) {
    return fillRosterDefaultPresentCompat(sessionId, excludeIds, userId);
}
exports.AttendanceSessionService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = { deletedAt: null };
        if (query.search) {
            whereClause.OR = [
                { dateBs: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [sessions, total] = await Promise.all([
            prismaClient_1.prismaMain.attendanceSession.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: SESSION_INCLUDE,
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.attendanceSession.count({ where: whereClause }),
        ]);
        return { data: sessions, pagination: { page, limit, total } };
    },
    async create(data, actor) {
        assertNoFutureDate(data.dateBs);
        const assignment = await prismaClient_1.prismaMain.teachingAssignment.findFirst({
            where: { id: data.teachingAssignmentId, deletedAt: null },
        });
        if (!assignment)
            throw new CustomError_1.CustomError("Teaching assignment not found", 404);
        if (!assignment.isActive)
            throw new CustomError_1.CustomError("Teaching assignment is inactive", 400);
        const [period, teacher] = await Promise.all([
            prismaClient_1.prismaMain.period.findFirst({
                where: { id: data.periodId, deletedAt: null },
            }),
            prismaClient_1.prismaMain.teacher.findFirst({
                where: { id: data.teacherId, deletedAt: null },
            }),
        ]);
        if (!period)
            throw new CustomError_1.CustomError("Period not found", 404);
        if (!teacher)
            throw new CustomError_1.CustomError("Teacher not found", 404);
        if (actor.role === "TEACHER") {
            const ownTeacherId = await getTeacherIdForUser(actor.userId);
            if (!ownTeacherId || assignment.teacherId !== ownTeacherId) {
                throw new CustomError_1.CustomError("You can only create sessions for your own teaching assignment", 403);
            }
        }
        const existing = await prismaClient_1.prismaMain.attendanceSession.findFirst({
            where: {
                teachingAssignmentId: data.teachingAssignmentId,
                periodId: data.periodId,
                dateBs: data.dateBs,
                deletedAt: null,
            },
            include: SESSION_INCLUDE,
        });
        if (existing)
            return existing;
        try {
            const session = await prismaClient_1.prismaMain.attendanceSession.create({
                data: {
                    teachingAssignmentId: data.teachingAssignmentId,
                    teacherId: data.teacherId,
                    periodId: data.periodId,
                    dateBs: data.dateBs,
                    ...(actor.userId && { createdBy: actor.userId }),
                },
                include: SESSION_INCLUDE,
            });
            await fillRosterDefaultPresentCompat(session.id, new Set(), actor.userId);
            return prismaClient_1.prismaMain.attendanceSession.findFirst({
                where: { id: session.id },
                include: SESSION_INCLUDE,
            });
        }
        catch (error) {
            if (error.code === "P2002") {
                return prismaClient_1.prismaMain.attendanceSession.findFirst({
                    where: {
                        teachingAssignmentId: data.teachingAssignmentId,
                        periodId: data.periodId,
                        dateBs: data.dateBs,
                        deletedAt: null,
                    },
                    include: SESSION_INCLUDE,
                });
            }
            throw error;
        }
    },
    async getById(id) {
        const session = await prismaClient_1.prismaMain.attendanceSession.findFirst({
            where: { id, deletedAt: null },
            include: SESSION_INCLUDE,
        });
        if (!session)
            throw new CustomError_1.CustomError("Attendance session not found", 404);
        const locked = await applyLazyLock(session);
        return { ...session, isLocked: session.isLocked || locked };
    },
    async roster(id) {
        const session = await prismaClient_1.prismaMain.attendanceSession.findFirst({
            where: { id, deletedAt: null },
            include: { teachingAssignment: { select: { id: true } } },
        });
        if (!session)
            throw new CustomError_1.CustomError("Attendance session not found", 404);
        const students = await getRosterStudents(session.teachingAssignmentId);
        const records = await prismaClient_1.prismaMain.studentAttendance.findMany({
            where: { sessionId: id, deletedAt: null },
            select: {
                id: true,
                sessionId: true,
                studentId: true,
                remarks: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        const recordByStudent = new Map(records.map((r) => [r.studentId, r]));
        return students.map((student) => ({
            student: {
                id: student.id,
                universityRegNo: student.universityRegNo,
                firstName: student.firstName,
                middleName: student.middleName,
                lastName: student.lastName,
            },
            record: recordByStudent.get(student.id) ?? null,
        }));
    },
    async update(id, data, actor) {
        const { records, ...sessionData } = data;
        const existing = await prismaClient_1.prismaMain.attendanceSession.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Attendance session not found", 404);
        await assertSessionWritableByLock(existing, actor.role);
        if (sessionData.dateBs)
            assertNoFutureDate(sessionData.dateBs);
        if (actor.role === "TEACHER") {
            const ownTeacherId = await getTeacherIdForUser(actor.userId);
            const lockedAssignmentId = sessionData.teachingAssignmentId ?? existing.teachingAssignmentId;
            const assignment = await prismaClient_1.prismaMain.teachingAssignment.findFirst({
                where: { id: lockedAssignmentId, deletedAt: null },
            });
            if (!assignment ||
                !ownTeacherId ||
                assignment.teacherId !== ownTeacherId) {
                throw new CustomError_1.CustomError("You can only update sessions for your own teaching assignment", 403);
            }
        }
        if (sessionData.teachingAssignmentId ||
            sessionData.periodId ||
            sessionData.dateBs) {
            const dup = await prismaClient_1.prismaMain.attendanceSession.findFirst({
                where: {
                    teachingAssignmentId: sessionData.teachingAssignmentId ?? existing.teachingAssignmentId,
                    periodId: sessionData.periodId ?? existing.periodId,
                    dateBs: sessionData.dateBs ?? existing.dateBs,
                    deletedAt: null,
                    id: { not: id },
                },
            });
            if (dup)
                throw new CustomError_1.CustomError("An attendance session already exists for this assignment, period and date", 409);
        }
        try {
            // Session metadata + per-student statuses succeed or fail together.
            return await prismaClient_1.prismaMain.$transaction(async (tx) => {
                const updated = await tx.attendanceSession.update({
                    where: { id },
                    data: { ...sessionData, updatedBy: actor.userId },
                    include: SESSION_INCLUDE,
                });
                if (records && records.length > 0) {
                    await saveSessionRecords(tx, id, records, actor.userId);
                }
                return updated;
            });
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("An attendance session already exists for this assignment, period and date", 409);
            }
            throw error;
        }
    },
    async unlock(id, reason, actor) {
        const trimmedReason = reason?.trim();
        if (!trimmedReason)
            throw new CustomError_1.CustomError("A reason is required to unlock an attendance session", 400);
        const existing = await prismaClient_1.prismaMain.attendanceSession.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Attendance session not found", 404);
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            const session = await tx.attendanceSession.update({
                where: { id },
                data: { isLocked: false, lockedAt: null, updatedBy: actor.userId },
                include: SESSION_INCLUDE,
            });
            await (0, audit_1.writeAudit)(tx, {
                entity: "AttendanceSession",
                entityId: id,
                action: "UNLOCK",
                oldValues: { isLocked: existing.isLocked, lockedAt: existing.lockedAt },
                newValues: { isLocked: false, reason: trimmedReason },
                userId: actor.userId,
            });
            return session;
        });
    },
    async delete(id, actor) {
        const existing = await prismaClient_1.prismaMain.attendanceSession.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Attendance session not found", 404);
        await assertSessionWritableByLock(existing, actor.role);
        await prismaClient_1.prismaMain.attendanceSession.update({
            where: { id },
            data: { deletedAt: new Date(), updatedBy: actor.userId },
        });
        return null;
    },
};
