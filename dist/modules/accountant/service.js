"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountantService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const employee_1 = require("@/utils/employee");
const CustomError_1 = require("@/errors/CustomError");
exports.AccountantService = {
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
        const [accountants, total] = await Promise.all([
            prismaClient_1.prismaMain.accountant.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    employee: { select: employee_1.EMPLOYEE_SAFE_SELECT },
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.accountant.count({ where: whereClause }),
        ]);
        return {
            data: accountants,
            pagination: { page, limit, total },
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
        await (0, employee_1.assertSingleRoleProfile)(prismaClient_1.prismaMain, data.employeeId, "ACCOUNTANT");
        try {
            const accountant = await prismaClient_1.prismaMain.accountant.create({
                data: {
                    ...data,
                    employeeId: data.employeeId,
                    createdBy: userId,
                },
                include: {
                    employee: { select: employee_1.EMPLOYEE_SAFE_SELECT },
                },
            });
            return accountant;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("An employee is already assigned as Accountant", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const accountant = await prismaClient_1.prismaMain.accountant.findFirst({
            where: { id, deletedAt: null },
            include: {
                employee: { select: employee_1.EMPLOYEE_SAFE_SELECT },
            },
        });
        if (!accountant) {
            throw new CustomError_1.CustomError("Accountant not found", 404);
        }
        return accountant;
    },
    async delete(id, userId) {
        const accountant = await prismaClient_1.prismaMain.accountant.findFirst({
            where: { id, deletedAt: null },
        });
        if (!accountant) {
            throw new CustomError_1.CustomError("Accountant not found", 404);
        }
        await prismaClient_1.prismaMain.accountant.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
};
