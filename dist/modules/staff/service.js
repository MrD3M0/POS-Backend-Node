"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const employee_1 = require("@/utils/employee");
const CustomError_1 = require("@/errors/CustomError");
exports.StaffService = {
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
        const [staffs, total] = await Promise.all([
            prismaClient_1.prismaMain.staff.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    employee: { select: employee_1.EMPLOYEE_SAFE_SELECT },
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.staff.count({ where: whereClause }),
        ]);
        return {
            staffs,
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
        await (0, employee_1.assertSingleRoleProfile)(prismaClient_1.prismaMain, data.employeeId, "STAFF");
        try {
            const staff = await prismaClient_1.prismaMain.staff.create({
                data: {
                    ...data,
                    employeeId: data.employeeId,
                    createdBy: userId,
                },
                include: {
                    employee: { select: employee_1.EMPLOYEE_SAFE_SELECT },
                },
            });
            return staff;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("An employee with this ID is already assigned as Staff", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const staff = await prismaClient_1.prismaMain.staff.findFirst({
            where: { id, deletedAt: null },
            include: {
                employee: { select: employee_1.EMPLOYEE_SAFE_SELECT },
            },
        });
        if (!staff) {
            throw new CustomError_1.CustomError("Staff not found", 404);
        }
        return staff;
    },
    async getMe(userId) {
        const employee = await prismaClient_1.prismaMain.employee.findFirst({
            where: { userId, deletedAt: null },
        });
        if (!employee) {
            throw new CustomError_1.CustomError("Employee profile not found for this user", 404);
        }
        const staff = await prismaClient_1.prismaMain.staff.findFirst({
            where: { employeeId: employee.id, deletedAt: null },
            include: {
                employee: { select: employee_1.EMPLOYEE_SAFE_SELECT },
            },
        });
        if (!staff) {
            throw new CustomError_1.CustomError("Staff profile not found for this user", 404);
        }
        return staff;
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.staff.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Staff not found", 404);
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
            await (0, employee_1.assertSingleRoleProfile)(prismaClient_1.prismaMain, data.employeeId, "STAFF");
        try {
            const { firstName, lastName, phone, permanentAddress, temporaryAddress, address, ...staffData } = data;
            const employeeUpdate = {};
            if (firstName !== undefined)
                employeeUpdate.firstName = firstName;
            if (lastName !== undefined)
                employeeUpdate.lastName = lastName;
            if (phone !== undefined)
                employeeUpdate.phone = phone;
            if (permanentAddress !== undefined)
                employeeUpdate.permanentAddress = permanentAddress;
            if (temporaryAddress !== undefined)
                employeeUpdate.temporaryAddress = temporaryAddress;
            if (address !== undefined) {
                employeeUpdate.permanentAddress = address;
                employeeUpdate.temporaryAddress = address;
            }
            const updated = await prismaClient_1.prismaMain.$transaction(async (tx) => {
                if (Object.keys(employeeUpdate).length > 0) {
                    await tx.employee.update({
                        where: { id: existing.employeeId },
                        data: { ...employeeUpdate, updatedBy: userId },
                    });
                }
                return tx.staff.update({
                    where: { id },
                    data: {
                        ...staffData,
                        updatedBy: userId,
                    },
                    include: {
                        employee: { select: employee_1.EMPLOYEE_SAFE_SELECT },
                    },
                });
            });
            return updated;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("An employee with this ID is already assigned as Staff", 409);
            }
            throw error;
        }
    },
    async delete(id, userId) {
        const staff = await prismaClient_1.prismaMain.staff.findFirst({
            where: { id, deletedAt: null },
        });
        if (!staff) {
            throw new CustomError_1.CustomError("Staff not found", 404);
        }
        await prismaClient_1.prismaMain.staff.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
};
