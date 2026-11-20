"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const employee_1 = require("@/utils/employee");
const CustomError_1 = require("@/errors/CustomError");
exports.TeacherService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {
            deletedAt: null,
        };
        if (query.search) {
            whereClause.OR = [
                { employee: { firstName: { contains: query.search, mode: "insensitive" } } },
                { employee: { lastName: { contains: query.search, mode: "insensitive" } } },
                { employee: { employeeCode: { contains: query.search, mode: "insensitive" } } },
            ];
        }
        const [teachers, total] = await Promise.all([
            prismaClient_1.prismaMain.teacher.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    employee: { select: employee_1.EMPLOYEE_SAFE_SELECT },
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.teacher.count({ where: whereClause }),
        ]);
        return {
            teachers,
            pagination: {
                page,
                limit,
                total,
            },
        };
    },
    async create(data, userId) {
        // Validate employee exists and is not soft-deleted
        const employee = await prismaClient_1.prismaMain.employee.findFirst({
            where: { id: data.employeeId, deletedAt: null },
        });
        if (!employee) {
            throw new CustomError_1.CustomError("Employee not found or has been deleted", 404);
        }
        await (0, employee_1.assertSingleRoleProfile)(prismaClient_1.prismaMain, data.employeeId, "TEACHER");
        try {
            const teacher = await prismaClient_1.prismaMain.teacher.create({
                data: {
                    ...data,
                    employeeId: data.employeeId,
                    createdBy: userId,
                },
                include: {
                    employee: { select: employee_1.EMPLOYEE_SAFE_SELECT },
                },
            });
            return teacher;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("An employee with this ID is already assigned as Teacher", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const teacher = await prismaClient_1.prismaMain.teacher.findFirst({
            where: { id, deletedAt: null },
            include: {
                employee: { select: employee_1.EMPLOYEE_SAFE_SELECT },
                assignments: { include: { batchTermSubject: true } },
                sessions: true,
            },
        });
        if (!teacher) {
            throw new CustomError_1.CustomError("Teacher not found", 404);
        }
        return teacher;
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.teacher.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Teacher not found", 404);
        }
        if (data.employeeId) {
            const employee = await prismaClient_1.prismaMain.employee.findFirst({
                where: { id: data.employeeId, deletedAt: null },
            });
            if (!employee) {
                throw new CustomError_1.CustomError("Employee not found or has been deleted", 404);
            }
        }
        if (data.employeeId)
            await (0, employee_1.assertSingleRoleProfile)(prismaClient_1.prismaMain, data.employeeId, "TEACHER");
        try {
            const updated = await prismaClient_1.prismaMain.teacher.update({
                where: { id },
                data: {
                    ...data,
                    updatedBy: userId,
                },
                include: {
                    employee: { select: employee_1.EMPLOYEE_SAFE_SELECT },
                    assignments: { include: { batchTermSubject: true } },
                    sessions: true,
                },
            });
            return updated;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("An employee with this ID is already assigned as Teacher", 409);
            }
            throw error;
        }
    },
    async delete(id, userId) {
        const teacher = await prismaClient_1.prismaMain.teacher.findFirst({
            where: { id, deletedAt: null },
        });
        if (!teacher) {
            throw new CustomError_1.CustomError("Teacher not found", 404);
        }
        await prismaClient_1.prismaMain.teacher.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
};
