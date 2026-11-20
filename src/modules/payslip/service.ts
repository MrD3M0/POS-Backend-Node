// =====================================================================
// Payslip service — hardened (Feature 9)
// NOTE: Payslip has NO deletedAt column in the schema (snapshot rows
// are append-only). Deletes are therefore hard deletes, and only when
// the parent payroll is still editable (DRAFT/REJECTED). APPROVED/PAID
// payslips are frozen — corrections require payroll regeneration.
// =====================================================================
import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { EMPLOYEE_SAFE_SELECT } from "@/utils/employee";
import { CustomError } from "@/errors/CustomError";
import { PayslipCreateInput, PayslipUpdateInput } from "./validator";

async function assertPayrollEditable(payrollId: string) {
  const payroll = await prismaMain.payroll.findFirst({
    where: { id: payrollId, deletedAt: null },
  });
  if (!payroll) throw new CustomError("Payroll not found", 404);
  if (payroll.status !== "DRAFT" && payroll.status !== "REJECTED") {
    throw new CustomError(
      `Payslip is frozen (payroll is ${payroll.status})`,
      409,
    );
  }
  return payroll;
}

export const PayslipService = {
  async index(query: {
    page?: number;
    limit?: number;
    search?: string;
    payrollId?: string;
    employeeId?: string;
  }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: Record<string, unknown> = {};
    if (query.payrollId) whereClause.payrollId = query.payrollId;
    if (query.employeeId) whereClause.employeeId = query.employeeId;
    if (query.search) {
      whereClause.OR = [
        { payslipNo: { contains: query.search, mode: "insensitive" } },
        { employeeId: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [slips, total] = await Promise.all([
      prismaMain.payslip.findMany({
        where: whereClause as never,
        skip,
        take: toPrismaTake(limit),
        include: {
          items: true,
          employee: { select: EMPLOYEE_SAFE_SELECT },
          payroll: true,
        },
        orderBy: { payslipNo: "asc" },
      }),
      prismaMain.payslip.count({ where: whereClause as never }),
    ]);

    return { data: slips, pagination: { page, limit, total } };
  },

  async create(data: PayslipCreateInput, userId?: string) {
    await assertPayrollEditable(data.payrollId);
    const employee = await prismaMain.employee.findFirst({
      where: { id: data.employeeId, deletedAt: null },
    });
    if (!employee) throw new CustomError("Employee not found", 404);
    try {
      return await prismaMain.payslip.create({
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
        include: { items: true, employee: { select: EMPLOYEE_SAFE_SELECT } },
      });
    } catch (error: unknown) {
      if ((error as { code?: string }).code === "P2002") {
        throw new CustomError(
          "A payslip already exists with this number or for this employee in the payroll",
          409,
        );
      }
      throw error;
    }
  },

  async getById(id: string) {
    const slip = await prismaMain.payslip.findFirst({
      where: { id },
      include: {
        items: true,
        employee: { select: EMPLOYEE_SAFE_SELECT },
        payroll: true,
      },
    });
    if (!slip) throw new CustomError("Payslip not found", 404);
    return slip;
  },

  async update(id: string, data: PayslipUpdateInput, userId?: string) {
    const existing = await prismaMain.payslip.findFirst({ where: { id } });
    if (!existing) throw new CustomError("Payslip not found", 404);
    await assertPayrollEditable(existing.payrollId);
    try {
      return await prismaMain.payslip.update({
        where: { id },
        data: { ...data, updatedBy: userId } as never,
        include: { items: true, employee: { select: EMPLOYEE_SAFE_SELECT } },
      });
    } catch (error: unknown) {
      if ((error as { code?: string }).code === "P2002") {
        throw new CustomError("A payslip already exists with this number", 409);
      }
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.payslip.findFirst({ where: { id } });
    if (!existing) throw new CustomError("Payslip not found", 404);
    await assertPayrollEditable(existing.payrollId);
    return prismaMain.$transaction(async (tx) => {
      await tx.payslipItem.deleteMany({ where: { payslipId: id } });
      await tx.payslip.delete({ where: { id } });
      return null;
    });
  },
};
