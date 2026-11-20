"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayslipService = void 0;
// =====================================================================
// Payslip service — hardened (Feature 9)
// NOTE: Payslip has NO deletedAt column in the schema (snapshot rows
// are append-only). Deletes are therefore hard deletes, and only when
// the parent payroll is still editable (DRAFT/REJECTED). APPROVED/PAID
// payslips are frozen — corrections require payroll regeneration.
// =====================================================================
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const employee_1 = require("@/utils/employee");
const CustomError_1 = require("@/errors/CustomError");
async function assertPayrollEditable(payrollId) {
    const payroll = await prismaClient_1.prismaMain.payroll.findFirst({
        where: { id: payrollId, deletedAt: null },
    });
    if (!payroll)
        throw new CustomError_1.CustomError("Payroll not found", 404);
    if (payroll.status !== "DRAFT" && payroll.status !== "REJECTED") {
        throw new CustomError_1.CustomError(`Payslip is frozen (payroll is ${payroll.status})`, 409);
    }
    return payroll;
}
exports.PayslipService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {};
        if (query.payrollId)
            whereClause.payrollId = query.payrollId;
        if (query.employeeId)
            whereClause.employeeId = query.employeeId;
        if (query.search) {
            whereClause.OR = [
                { payslipNo: { contains: query.search, mode: "insensitive" } },
                { employeeId: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [slips, total] = await Promise.all([
            prismaClient_1.prismaMain.payslip.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    items: true,
                    employee: { select: employee_1.EMPLOYEE_SAFE_SELECT },
                    payroll: true,
                },
                orderBy: { payslipNo: "asc" },
            }),
            prismaClient_1.prismaMain.payslip.count({ where: whereClause }),
        ]);
        return { data: slips, pagination: { page, limit, total } };
    },
    async create(data, userId) {
        await assertPayrollEditable(data.payrollId);
        const employee = await prismaClient_1.prismaMain.employee.findFirst({
            where: { id: data.employeeId, deletedAt: null },
        });
        if (!employee)
            throw new CustomError_1.CustomError("Employee not found", 404);
        try {
            return await prismaClient_1.prismaMain.payslip.create({
                data: {
                    payslipNo: data.payslipNo,
                    payrollId: data.payrollId,
                    employeeId: data.employeeId,
                    paymentMethodId: data.paymentMethodId ?? null,
                    presentDays: data.presentDays,
                    halfDays: data.halfDays,
                    paidLeaveDays: data.paidLeaveDays,
                    unpaidLeaveDays: data.unpaidLeaveDays,
                    absentDays: data.absentDays,
                    basicSalary: data.basicSalary,
                    attendanceDeduction: data.attendanceDeduction ?? "0",
                    totalAllowance: data.totalAllowance ?? "0",
                    teachingPay: data.teachingPay ?? "0",
                    grossPay: data.grossPay,
                    totalDeduction: data.totalDeduction,
                    taxAmount: data.taxAmount ?? "0",
                    netPay: data.netPay,
                    paidDateBs: data.paidDateBs ?? null,
                    createdBy: userId,
                },
                include: { items: true, employee: { select: employee_1.EMPLOYEE_SAFE_SELECT } },
            });
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A payslip already exists with this number or for this employee in the payroll", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const slip = await prismaClient_1.prismaMain.payslip.findFirst({
            where: { id },
            include: {
                items: true,
                employee: { select: employee_1.EMPLOYEE_SAFE_SELECT },
                payroll: true,
            },
        });
        if (!slip)
            throw new CustomError_1.CustomError("Payslip not found", 404);
        return slip;
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.payslip.findFirst({ where: { id } });
        if (!existing)
            throw new CustomError_1.CustomError("Payslip not found", 404);
        await assertPayrollEditable(existing.payrollId);
        try {
            return await prismaClient_1.prismaMain.payslip.update({
                where: { id },
                data: { ...data, updatedBy: userId },
                include: { items: true, employee: { select: employee_1.EMPLOYEE_SAFE_SELECT } },
            });
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A payslip already exists with this number", 409);
            }
            throw error;
        }
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.payslip.findFirst({ where: { id } });
        if (!existing)
            throw new CustomError_1.CustomError("Payslip not found", 404);
        await assertPayrollEditable(existing.payrollId);
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            await tx.payslipItem.deleteMany({ where: { payslipId: id } });
            await tx.payslip.delete({ where: { id } });
            return null;
        });
    },
};
