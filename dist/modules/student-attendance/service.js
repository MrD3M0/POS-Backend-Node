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
exports.StudentAttendanceService = exports.ATTENDANCE_FACTOR = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const CustomError_1 = require("@/errors/CustomError");
const queryFilters_1 = require("@/utils/queryFilters");
const client_1 = require("@/generated/prisma/client");
const service_1 = require("@/modules/holiday/service");
const studentSelect = {
    id: true,
    universityRegNo: true,
    firstName: true,
    middleName: true,
    lastName: true,
    batchId: true,
};
const defaultInclude = {
    session: true,
    student: { select: studentSelect },
};
// Salary factor per status: PRESENT/LATE = 1, LEAVE/ABSENT = 0.
exports.ATTENDANCE_FACTOR = {
    PRESENT: 1,
    LATE: 1,
    LEAVE: 0,
    ABSENT: 0,
};
async function getTeacherIdForUser(userId) {
    if (!userId)
        return null;
    const teacher = await prismaClient_1.prismaMain.teacher.findFirst({
        where: { deletedAt: null, employee: { userId, deletedAt: null } },
        select: { id: true },
    });
    return teacher?.id ?? null;
}
async function getStudentIdForUser(userId) {
    if (!userId)
        return null;
    const student = await prismaClient_1.prismaMain.student.findFirst({
        where: { userId, deletedAt: null },
        select: { id: true },
    });
    return student?.id ?? null;
}
async function assertSessionWritable(sessionId, actor) {
    const session = await prismaClient_1.prismaMain.attendanceSession.findFirst({
        where: { id: sessionId, deletedAt: null },
    });
    if (!session)
        throw new CustomError_1.CustomError("Attendance session not found", 404);
    if (actor.role !== "ADMIN" && actor.role !== "PRINCIPAL") {
        const editHours = await (await Promise.resolve().then(() => __importStar(require("@/lib/settings"))))
            .getAttendanceEditHours()
            .catch(() => 24);
        const ageHours = (Date.now() - new Date(session.createdAt).getTime()) / 3_600_000;
        if (session.isLocked || ageHours > editHours) {
            if (!session.isLocked) {
                await prismaClient_1.prismaMain.attendanceSession
                    .update({
                    where: { id: sessionId },
                    data: { isLocked: true, lockedAt: new Date() },
                })
                    .catch(() => { });
            }
            throw new CustomError_1.CustomError("This attendance session is locked (edit window passed). Only PRINCIPAL/ADMIN can unlock.", 423);
        }
    }
    if (actor.role === "TEACHER") {
        const teacherId = await getTeacherIdForUser(actor.userId);
        const assignment = await prismaClient_1.prismaMain.teachingAssignment.findFirst({
            where: { id: session.teachingAssignmentId, deletedAt: null },
            select: { teacherId: true },
        });
        if (!teacherId || !assignment || assignment.teacherId !== teacherId) {
            throw new CustomError_1.CustomError("You can only manage attendance for sessions of your own teaching assignment", 403);
        }
    }
    return session;
}
async function getRoster(sessionId) {
    const session = await prismaClient_1.prismaMain.attendanceSession.findFirst({
        where: { id: sessionId, deletedAt: null },
        include: {
            teachingAssignment: {
                include: { batchTermSubject: { include: { batchTerm: true } } },
            },
        },
    });
    if (!session)
        throw new CustomError_1.CustomError("Attendance session not found", 404);
    const batchId = session.teachingAssignment.batchTermSubject.batchTerm.batchId;
    const students = await prismaClient_1.prismaMain.student.findMany({
        where: {
            batchId,
            approvalStatus: "APPROVED",
            status: "ACTIVE",
            deletedAt: null,
        },
        select: { id: true },
    });
    return { session, rosterIds: new Set(students.map((s) => s.id)) };
}
function assertInRoster(studentIds, rosterIds) {
    const notInRoster = studentIds.filter((id) => !rosterIds.has(id));
    if (notInRoster.length > 0) {
        throw new CustomError_1.CustomError(`Students not in the session roster (APPROVED+ACTIVE batch students): ${notInRoster.join(", ")}`, 422);
    }
}
function fetchSessionRecords(sessionId) {
    return prismaClient_1.prismaMain.studentAttendance.findMany({
        where: { sessionId, deletedAt: null },
        include: defaultInclude,
        orderBy: { student: { universityRegNo: "asc" } },
    });
}
exports.StudentAttendanceService = {
    async index(query, actor) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const { skip, take } = (0, queryFilters_1.calculateSkipAndTake)(page, limit);
        const whereClause = { deletedAt: null };
        if (query.sessionId)
            whereClause.sessionId = query.sessionId;
        if (query.status)
            whereClause.status = query.status;
        if (query.dateBs) {
            whereClause.session = { is: { dateBs: query.dateBs, deletedAt: null } };
        }
        if (actor.role === "STUDENT") {
            const ownStudentId = await getStudentIdForUser(actor.userId);
            if (!ownStudentId)
                return { data: [], pagination: { page, limit, total: 0 } };
            whereClause.studentId = ownStudentId;
        }
        else if (query.studentId) {
            whereClause.studentId = query.studentId;
        }
        if (query.batchId) {
            whereClause.student = { is: { batchId: query.batchId } };
        }
        const [records, total] = await Promise.all([
            prismaClient_1.prismaMain.studentAttendance.findMany({
                where: whereClause,
                skip,
                take,
                include: defaultInclude,
                orderBy: query.sessionId
                    ? { student: { universityRegNo: "asc" } }
                    : { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.studentAttendance.count({ where: whereClause }),
        ]);
        return { data: records, pagination: { page, limit, total } };
    },
    async create(data, actor) {
        await assertSessionWritable(data.sessionId, actor);
        const { rosterIds } = await getRoster(data.sessionId);
        assertInRoster([data.studentId], rosterIds);
        const existing = await prismaClient_1.prismaMain.studentAttendance.findFirst({
            where: {
                sessionId: data.sessionId,
                studentId: data.studentId,
                deletedAt: null,
            },
        });
        if (existing)
            throw new CustomError_1.CustomError("Attendance is already marked for this student in this session", 409);
        return prismaClient_1.prismaMain.studentAttendance.create({
            data: {
                sessionId: data.sessionId,
                studentId: data.studentId,
                status: data.status,
                remarks: data.remarks ?? null,
                createdBy: actor.userId,
            },
            include: defaultInclude,
        });
    },
    async bulkMark(data, actor) {
        await assertSessionWritable(data.sessionId, actor);
        const studentIds = data.records.map((r) => r.studentId);
        if (new Set(studentIds).size !== studentIds.length) {
            throw new CustomError_1.CustomError("Duplicate students found in the request", 400);
        }
        const { rosterIds } = await getRoster(data.sessionId);
        assertInRoster(studentIds, rosterIds);
        const explicitIds = new Set(studentIds);
        const defaulted = [...rosterIds]
            .filter((id) => !explicitIds.has(id))
            .map((studentId) => ({
            studentId,
            status: client_1.AttendanceStatus.PRESENT,
            remarks: null,
        }));
        const allRecords = [
            ...data.records.map((r) => ({
                studentId: r.studentId,
                status: r.status,
                remarks: r.remarks ?? null,
            })),
            ...defaulted,
        ];
        await prismaClient_1.prismaMain.$transaction(async (tx) => {
            for (const record of allRecords) {
                await tx.studentAttendance.upsert({
                    where: {
                        sessionId_studentId: {
                            sessionId: data.sessionId,
                            studentId: record.studentId,
                        },
                    },
                    create: {
                        sessionId: data.sessionId,
                        studentId: record.studentId,
                        status: record.status,
                        remarks: record.remarks,
                        createdBy: actor.userId,
                    },
                    update: {
                        status: record.status,
                        remarks: record.remarks,
                        deletedAt: null,
                        updatedBy: actor.userId,
                    },
                });
            }
        });
        return fetchSessionRecords(data.sessionId);
    },
    async getById(id, actor) {
        const record = await prismaClient_1.prismaMain.studentAttendance.findFirst({
            where: { id, deletedAt: null },
            include: defaultInclude,
        });
        if (!record)
            throw new CustomError_1.CustomError("Student attendance not found", 404);
        if (actor.role === "STUDENT") {
            const ownStudentId = await getStudentIdForUser(actor.userId);
            if (record.studentId !== ownStudentId)
                throw new CustomError_1.CustomError("Student attendance not found", 404);
        }
        return record;
    },
    async summary(studentId, range, actor) {
        if (actor.role === "STUDENT") {
            const ownStudentId = await getStudentIdForUser(actor.userId);
            if (studentId !== ownStudentId)
                throw new CustomError_1.CustomError("Student not found", 404);
        }
        const student = await prismaClient_1.prismaMain.student.findFirst({
            where: { id: studentId, deletedAt: null },
            select: studentSelect,
        });
        if (!student)
            throw new CustomError_1.CustomError("Student not found", 404);
        const where = {
            studentId,
            deletedAt: null,
        };
        // Sessions held on student holidays are not working days: they count
        // toward neither the numerator nor the denominator of attendance %.
        const holidayDateBs = [
            ...(await (0, service_1.studentHolidayDateBs)(range.fromBs || range.toBs ? range : undefined)),
        ];
        const sessionDateBs = {};
        if (range.fromBs)
            sessionDateBs.gte = range.fromBs;
        if (range.toBs)
            sessionDateBs.lte = range.toBs;
        if (holidayDateBs.length > 0)
            sessionDateBs.notIn = holidayDateBs;
        if (Object.keys(sessionDateBs).length > 0) {
            where.session = { is: { dateBs: sessionDateBs } };
        }
        const grouped = await prismaClient_1.prismaMain.studentAttendance.groupBy({
            by: ["status"],
            where,
            _count: { _all: true },
        });
        const byStatus = grouped.map((g) => ({
            status: g.status,
            count: g._count._all,
            factor: exports.ATTENDANCE_FACTOR[g.status] ?? 0,
        }));
        const totalSessions = byStatus.reduce((sum, s) => sum + s.count, 0);
        const presentDays = byStatus.reduce((sum, s) => sum + s.count * s.factor, 0);
        const attendancePercent = totalSessions === 0
            ? 0
            : Math.round((presentDays / totalSessions) * 10000) / 100;
        return { student, totalSessions, byStatus, presentDays, attendancePercent };
    },
    async update(id, data, actor) {
        const record = await prismaClient_1.prismaMain.studentAttendance.findFirst({
            where: { id, deletedAt: null },
        });
        if (!record)
            throw new CustomError_1.CustomError("Student attendance not found", 404);
        await assertSessionWritable(record.sessionId, actor);
        return prismaClient_1.prismaMain.studentAttendance.update({
            where: { id },
            data: {
                ...(data.status ? { status: data.status } : {}),
                ...(data.remarks !== undefined ? { remarks: data.remarks } : {}),
                updatedBy: actor.userId,
            },
            include: defaultInclude,
        });
    },
    async delete(id, actor) {
        const record = await prismaClient_1.prismaMain.studentAttendance.findFirst({
            where: { id, deletedAt: null },
        });
        if (!record)
            throw new CustomError_1.CustomError("Student attendance not found", 404);
        await assertSessionWritable(record.sessionId, actor);
        await prismaClient_1.prismaMain.studentAttendance.update({
            where: { id },
            data: { deletedAt: new Date(), updatedBy: actor.userId },
        });
        return null;
    },
};
