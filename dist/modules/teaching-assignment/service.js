"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeachingAssignmentService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
exports.TeachingAssignmentService = {
    async index(query, context) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {
            deletedAt: null,
        };
        // A teacher only ever sees their own assignments ("My Classes").
        if (context?.role === "TEACHER") {
            const teacher = await prismaClient_1.prismaMain.teacher.findFirst({
                where: {
                    deletedAt: null,
                    employee: { userId: context.userId ?? "", deletedAt: null },
                },
                select: { id: true },
            });
            if (!teacher) {
                return {
                    data: [],
                    pagination: { page, limit, total: 0 },
                };
            }
            whereClause.teacherId = teacher.id;
        }
        if (query.search) {
            whereClause.OR = [
                { teacherId: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [assignments, total] = await Promise.all([
            prismaClient_1.prismaMain.teachingAssignment.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    teacher: {
                        select: {
                            id: true,
                            employee: {
                                select: { firstName: true, middleName: true, lastName: true, employeeCode: true },
                            },
                        },
                    },
                    batchTermSubject: {
                        select: {
                            id: true,
                            subject: { select: { code: true, name: true } },
                            batchTerm: {
                                select: {
                                    termNumber: true,
                                    name: true,
                                    // `id` is needed by the teacher notice audience picker
                                    batch: { select: { id: true, name: true } },
                                },
                            },
                        },
                    },
                    sessions: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.teachingAssignment.count({ where: whereClause }),
        ]);
        return {
            data: assignments,
            pagination: { page, limit, total },
        };
    },
    async create(data, userId) {
        const [teacher, batchTermSubject] = await Promise.all([
            prismaClient_1.prismaMain.teacher.findFirst({ where: { id: data.teacherId, deletedAt: null } }),
            prismaClient_1.prismaMain.batchTermSubject.findFirst({ where: { id: data.batchTermSubjectId, deletedAt: null } }),
        ]);
        if (!teacher)
            throw new CustomError_1.CustomError("Teacher not found or has been deleted", 404);
        if (!batchTermSubject)
            throw new CustomError_1.CustomError("Batch term subject not found or has been deleted", 404);
        if (data.endDateBs && data.endDateBs < data.assignedDateBs) {
            throw new CustomError_1.CustomError("endDateBs must be on or after assignedDateBs", 400);
        }
        const duplicate = await prismaClient_1.prismaMain.teachingAssignment.findFirst({
            where: { teacherId: data.teacherId, batchTermSubjectId: data.batchTermSubjectId },
        });
        if (duplicate) {
            throw new CustomError_1.CustomError("This teacher is already assigned to this batch term subject", 409);
        }
        try {
            const assignment = await prismaClient_1.prismaMain.teachingAssignment.create({
                data: {
                    ...data,
                    createdBy: userId,
                },
                include: {
                    sessions: true,
                },
            });
            return assignment;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("This teacher is already assigned to this batch term subject", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const assignment = await prismaClient_1.prismaMain.teachingAssignment.findFirst({
            where: { id, deletedAt: null },
            include: {
                sessions: true,
            },
        });
        if (!assignment) {
            throw new CustomError_1.CustomError("Teaching assignment not found", 404);
        }
        return assignment;
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.teachingAssignment.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Teaching assignment not found", 404);
        }
        const teacherId = data.teacherId ?? existing.teacherId;
        const batchTermSubjectId = data.batchTermSubjectId ?? existing.batchTermSubjectId;
        const assignedDateBs = data.assignedDateBs ?? existing.assignedDateBs;
        const endDateBs = data.endDateBs !== undefined ? data.endDateBs : existing.endDateBs;
        if (endDateBs && endDateBs < assignedDateBs) {
            throw new CustomError_1.CustomError("endDateBs must be on or after assignedDateBs", 400);
        }
        if (data.teacherId) {
            const teacher = await prismaClient_1.prismaMain.teacher.findFirst({ where: { id: data.teacherId, deletedAt: null } });
            if (!teacher)
                throw new CustomError_1.CustomError("Teacher not found or has been deleted", 404);
        }
        if (data.batchTermSubjectId) {
            const bts = await prismaClient_1.prismaMain.batchTermSubject.findFirst({
                where: { id: data.batchTermSubjectId, deletedAt: null },
            });
            if (!bts)
                throw new CustomError_1.CustomError("Batch term subject not found or has been deleted", 404);
        }
        const duplicate = await prismaClient_1.prismaMain.teachingAssignment.findFirst({
            where: { teacherId, batchTermSubjectId, NOT: { id } },
        });
        if (duplicate) {
            throw new CustomError_1.CustomError("This teacher is already assigned to this batch term subject", 409);
        }
        try {
            const updated = await prismaClient_1.prismaMain.teachingAssignment.update({
                where: { id },
                data: {
                    ...data,
                    updatedBy: userId,
                },
                include: {
                    sessions: true,
                },
            });
            return updated;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("This teacher is already assigned to this batch term subject", 409);
            }
            throw error;
        }
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.teachingAssignment.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Teaching assignment not found", 404);
        }
        await prismaClient_1.prismaMain.teachingAssignment.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
    /**
     * Teacher workload for the assignment form: how many subjects are assigned
     * and how many periods are on the weekly schedule.
     */
    async workload(teacherId) {
        const teacher = await prismaClient_1.prismaMain.teacher.findFirst({
            where: { id: teacherId, deletedAt: null },
            select: { id: true },
        });
        if (!teacher)
            throw new CustomError_1.CustomError("Teacher not found or has been deleted", 404);
        const [assignedSubjects, weeklyScheduledPeriods] = await Promise.all([
            prismaClient_1.prismaMain.teachingAssignment.count({
                where: { teacherId, deletedAt: null, isActive: true },
            }),
            prismaClient_1.prismaMain.classSchedule.count({
                where: {
                    deletedAt: null,
                    isActive: true,
                    teachingAssignment: { teacherId, deletedAt: null },
                },
            }),
        ]);
        return { teacherId, assignedSubjects, weeklyScheduledPeriods };
    },
    /**
     * When an assignment ends, optionally close its still-open weekly schedules:
     * effectiveToBs = endDateBs for schedules that reach beyond it. Rows already
     * closing on or before endDateBs are left untouched.
     */
    async closeSchedules(assignmentId, endDateBs, userId) {
        const open = await prismaClient_1.prismaMain.classSchedule.findMany({
            where: {
                deletedAt: null,
                teachingAssignmentId: assignmentId,
                OR: [{ effectiveToBs: null }, { effectiveToBs: { gt: endDateBs } }],
            },
            select: { id: true },
        });
        if (open.length === 0)
            return 0;
        await prismaClient_1.prismaMain.classSchedule.updateMany({
            where: { id: { in: open.map((row) => row.id) } },
            data: { effectiveToBs: endDateBs, updatedBy: userId },
        });
        return open.length;
    },
};
