"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalaryStructureService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const employee_1 = require("@/utils/employee");
const CustomError_1 = require("@/errors/CustomError");
exports.SalaryStructureService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {};
        if (query.search) {
            whereClause.OR = [
                { remarks: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [structures, total] = await Promise.all([
            prismaClient_1.prismaMain.salaryStructure.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    employee: { select: employee_1.EMPLOYEE_SAFE_SELECT },
                    items: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.salaryStructure.count({ where: whereClause }),
        ]);
        return {
            structures,
            pagination: {
                page,
                limit,
                total,
            },
        };
    },
    async create(data, userId) {
        // Validate employee exists
        const employee = await prismaClient_1.prismaMain.employee.findFirst({
            where: { id: data.employeeId, deletedAt: null },
        });
        if (!employee) {
            throw new CustomError_1.CustomError("Employee not found or has been deleted", 404);
        }
        try {
            const structure = await prismaClient_1.prismaMain.salaryStructure.create({
                data: {
                    ...data,
                    createdBy: userId,
                },
                include: {
                    employee: { select: employee_1.EMPLOYEE_SAFE_SELECT },
                    items: true,
                },
            });
            return structure;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A salary structure already exists for this employee", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const structure = await prismaClient_1.prismaMain.salaryStructure.findFirst({
            where: { id, deletedAt: null },
            include: {
                employee: { select: employee_1.EMPLOYEE_SAFE_SELECT },
                items: true,
            },
        });
        if (!structure) {
            throw new CustomError_1.CustomError("Salary structure not found", 404);
        }
        return structure;
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.salaryStructure.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Salary structure not found", 404);
        }
        try {
            const updated = await prismaClient_1.prismaMain.salaryStructure.update({
                where: { id },
                data: {
                    ...data,
                    updatedBy: userId,
                },
                include: {
                    employee: { select: employee_1.EMPLOYEE_SAFE_SELECT },
                    items: true,
                },
            });
            return updated;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A salary structure already exists for this employee", 409);
            }
            throw error;
        }
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.salaryStructure.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Salary structure not found", 404);
        }
        await prismaClient_1.prismaMain.salaryStructure.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
};
