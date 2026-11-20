// =====================================================================
// Payroll service — hardened (Feature 9)
// ---------------------------------------------------------------------
//  - totalDays is ALWAYS derived server-side from the BS month table
//    (src/utils/bs-date.ts) — never trusted from the client, never 30.
//  - One payroll per (yearBs, monthBs) — schema @@unique, P2002 -> 409.
//  - Status flow: DRAFT -> PENDING -> APPROVED | REJECTED -> PAID,
//    with REJECTED -> DRAFT (via resubmit). Enforced server-side.
//  - Payslips are generated from effective SalaryStructures, attendance
//    factors and TaxSlabs (see calc.ts). Regeneration is only allowed
//    in DRAFT / REJECTED; APPROVED payroll locks the month's attendance.
//  - On PAID a balanced JOURNAL ENTRY (source=PAYROLL) is posted:
//      Dr Salary Expense (gross), Dr SSF Employer Expense (employer
//      contributions), Cr Salary Payable (net), Cr TDS Payable,
//      Cr SSF/PF/CIT Payable (per deduction component).
//    Account codes come from the seed chart of accounts; missing
//    accounts fail fast with a clear error instead of a half-posting.
//  - payslipNo: PS-<yearBs>-<MM>-<seq:4> sequential within the payroll.
// =====================================================================
import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { EMPLOYEE_SAFE_SELECT } from "@/utils/employee";
import { CustomError } from "@/errors/CustomError";
import { PayrollCreateInput, PayrollUpdateInput } from "./validator";
import { bsMonthRange, getDaysInBsMonth } from "@/utils/bs-date";
import { Prisma } from "@/generated/prisma/client.js";
import {
  AttendanceRecordLite,
  calculatePayslip,
  computeTeachingPay,
  summarizeAttendance,
  TeachingPayInput,
} from "./calc";

const Decimal = Prisma.Decimal;
type TxClient = any;

// ---------------------------------------------------------------------
// Settings helpers (fallbacks are the built-in defaults)
// ---------------------------------------------------------------------
async function getSetting(
  tx: TxClient,
  key: string,
  fallback: string,
): Promise<string> {
  const s = await tx.setting.findUnique({ where: { key } });
  return s?.value ?? fallback;
}

async function getWorkingDaysMode(tx: TxClient): Promise<string> {
  const s = await tx.setting.findUnique({
    where: { key: "WORKING_DAYS_MODE" },
  });
  const raw = s?.value ?? "CALENDAR";
  // Legacy WORKING meant Saturdays off; keep that behaviour under the new name.
  return raw === "WORKING" ? "EXCLUDE_HOLIDAYS_AND_WEEKLY_OFF" : raw;
}

async function nextEntryNo(
  tx: TxClient,
  fiscalYearName: string,
): Promise<string> {
  const prefix = `JV-${fiscalYearName}-`;
  const existing = await tx.journalEntry.findMany({
    where: { entryNo: { startsWith: prefix } },
    select: { entryNo: true },
  });
  let max = 0;
  for (const e of existing) {
    const n = Number(e.entryNo.slice(prefix.length));
    if (Number.isInteger(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(6, "0")}`;
}

// ---------------------------------------------------------------------
// Payslip generation for one payroll (DRAFT / REJECTED only)
// ---------------------------------------------------------------------
async function generatePayslips(
  tx: TxClient,
  payroll: {
    id: string;
    yearBs: number;
    monthBs: number;
    fiscalYearId: string;
  },
  userId?: string,
) {
  const { startBs, endBs, totalDays } = bsMonthRange(
    payroll.yearBs,
    payroll.monthBs,
  );
  const workingDaysMode = await getWorkingDaysMode(tx);

  // Employees with a salary structure effective during this BS month.
  // Latest effectiveFromBs wins per employee (ordered desc, first seen).
  const structures = await tx.salaryStructure.findMany({
    where: {
      deletedAt: null,
      effectiveFromBs: { lte: endBs },
      OR: [{ effectiveToBs: null }, { effectiveToBs: { gte: startBs } }],
    },
    include: {
      employee: { select: EMPLOYEE_SAFE_SELECT },
      items: {
        where: { deletedAt: null },
        include: { component: true },
      },
    },
    orderBy: { effectiveFromBs: "desc" },
  });

  const byEmployee = new Map<string, (typeof structures)[number]>();
  for (const s of structures) {
    if (!s.employee || s.employee.deletedAt || !s.employee.isActive) continue;
    if (!byEmployee.has(s.employeeId)) byEmployee.set(s.employeeId, s);
  }

  const taxSlabs = await tx.taxSlab.findMany({
    where: {
      fiscalYearId: payroll.fiscalYearId,
      isCouple: false,
      deletedAt: null,
    },
  });
  const slabLites = taxSlabs.map((s: any) => ({
    fromAmount: new Decimal(s.fromAmount.toString()),
    toAmount: s.toAmount ? new Decimal(s.toAmount.toString()) : null,
    ratePercent: new Decimal(s.ratePercent.toString()),
  }));

  // Attendance for the whole month in one query.
  const attendances = await tx.employeeAttendance.findMany({
    where: {
      deletedAt: null,
      dateBs: { gte: startBs, lte: endBs },
    },
    include: { leaveType: true },
  });
  const holidayRows = await tx.holiday.findMany({
    where: {
      deletedAt: null,
      appliesToEmployees: true,
      dateBs: { gte: startBs, lte: endBs },
    },
    select: { dateBs: true },
  });
  const holidayDates = new Set<string>(
    holidayRows.map((h: { dateBs: string }) => h.dateBs),
  );
  const byEmployeeAttendance = new Map<string, typeof attendances>();
  for (const a of attendances) {
    const list = byEmployeeAttendance.get(a.employeeId) ?? [];
    list.push(a);
    byEmployeeAttendance.set(a.employeeId, list);
  }

  // Teaching pay per teacher-employee effective in this month.
  const teacherPays = await tx.teacherBatchPay.findMany({
    where: {
      deletedAt: null,
      effectiveFromBs: { lte: endBs },
      OR: [{ effectiveToBs: null }, { effectiveToBs: { gte: startBs } }],
    },
    include: {
      teachingAssignment: {
        select: {
          teacherId: true,
          batchTermSubject: { select: { creditHour: true } },
        },
      },
    },
  });
  // Resolve teacher -> employee in one query (avoid N+1).
  const teacherIds = [
    ...new Set(teacherPays.map((p: any) => p.teachingAssignment.teacherId)),
  ];
  const teachers = teacherIds.length
    ? await tx.teacher.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true, employeeId: true },
      })
    : [];
  const employeeByTeacher = new Map(
    teachers.map((t: any) => [t.id as string, t.employeeId as string]),
  );
  const teachingPayByEmployee = new Map<string, TeachingPayInput[]>();
  for (const p of teacherPays as any[]) {
    const employeeId = employeeByTeacher.get(p.teachingAssignment.teacherId) as
      string | undefined;
    if (!employeeId) continue;
    const entry: TeachingPayInput = {
      fixedMonthlyAmount: p.fixedMonthlyAmount
        ? new Decimal(p.fixedMonthlyAmount.toString())
        : null,
      ratePerCreditHour: p.ratePerCreditHour
        ? new Decimal(p.ratePerCreditHour.toString())
        : null,
      creditHour: new Decimal(
        p.teachingAssignment.batchTermSubject.creditHour.toString(),
      ),
    };
    const list = teachingPayByEmployee.get(employeeId) ?? [];
    list.push(entry);
    teachingPayByEmployee.set(employeeId, list);
  }

  // Replace existing payslips of this payroll (caller guarantees editable status).
  await tx.payslipItem.deleteMany({
    where: { payslip: { payrollId: payroll.id } },
  });
  await tx.payslip.deleteMany({ where: { payrollId: payroll.id } });

  // Sequential payslip numbers for this payroll run.
  const payslipPrefix = `PS-${payroll.yearBs}-${String(payroll.monthBs).padStart(2, "0")}-`;
  const existingNos = await tx.payslip.findMany({
    where: { payslipNo: { startsWith: payslipPrefix } },
    select: { payslipNo: true },
  });
  let seq = 0;
  for (const e of existingNos) {
    const n = Number(e.payslipNo.slice(payslipPrefix.length));
    if (Number.isInteger(n) && n > seq) seq = n;
  }

  let generated = 0;
  const skipped: { employeeId: string; reason: string }[] = [];

  for (const [employeeId, structure] of byEmployee) {
    const basic = new Decimal(structure.basicSalary.toString());
    const records: AttendanceRecordLite[] = (
      (byEmployeeAttendance.get(employeeId) ?? []) as any[]
    ).map((a: any) => ({
      dateBs: a.dateBs,
      status: a.status as AttendanceRecordLite["status"],
      isPaidLeave: a.leaveType ? a.leaveType.isPaid : a.status !== "LEAVE",
    }));
    const summary = summarizeAttendance(
      records,
      payroll.yearBs,
      payroll.monthBs,
      workingDaysMode,
      holidayDates,
    );
    const teachingPay = computeTeachingPay(
      teachingPayByEmployee.get(employeeId) ?? [],
    );
    const calc = calculatePayslip({
      basicSalary: basic,
      attendance: summary,
      structureItems: (structure.items as any[]).map((i: any) => ({
        code: i.component.code,
        name: i.component.name,
        isDeduction: i.component.isDeduction,
        isEmployerContribution: i.component.isEmployerContribution,
        isTaxable: i.component.isTaxable,
        amount: new Decimal(i.amount.toString()),
        isPercentOfBasic: i.isPercentOfBasic,
      })),
      teachingPay,
      taxSlabs: slabLites,
    });

    seq++;
    const payslipNo = `${payslipPrefix}${String(seq).padStart(4, "0")}`;
    await tx.payslip.create({
      data: {
        payslipNo,
        payrollId: payroll.id,
        employeeId,
        presentDays: calc.attendance.presentDays,
        halfDays: calc.attendance.halfDays,
        paidLeaveDays: calc.attendance.paidLeaveDays,
        unpaidLeaveDays: calc.attendance.unpaidLeaveDays,
        absentDays: calc.attendance.absentDays,
        basicSalary: basic,
        attendanceDeduction: calc.attendanceDeduction,
        totalAllowance: calc.totalAllowance,
        teachingPay: calc.teachingPay,
        grossPay: calc.grossPay,
        totalDeduction: calc.totalDeduction,
        taxAmount: calc.taxAmount,
        netPay: calc.netPay,
        createdBy: userId,
        items: {
          create: [
            {
              description: "Basic (earned after attendance deduction)",
              amount: calc.basicEarned,
              isDeduction: false,
              isEmployerContribution: false,
              createdBy: userId,
            },
            ...calc.allowanceItems.map((i) => ({
              description: `${i.name} (${i.code})`,
              amount: i.amount,
              isDeduction: false,
              isEmployerContribution: false,
              createdBy: userId,
            })),
            ...calc.deductionItems.map((i) => ({
              description: `${i.name} (${i.code})`,
              amount: i.amount,
              isDeduction: true,
              isEmployerContribution: false,
              createdBy: userId,
            })),
            ...calc.employerItems.map((i) => ({
              description: `${i.name} (${i.code}) — employer, not deducted`,
              amount: i.amount,
              isDeduction: false,
              isEmployerContribution: true,
              createdBy: userId,
            })),
            {
              description: "Income tax (TDS)",
              amount: calc.taxAmount,
              isDeduction: true,
              isEmployerContribution: false,
              createdBy: userId,
            },
            {
              description: "Teaching pay (TeacherBatchPay)",
              amount: calc.teachingPay,
              isDeduction: false,
              isEmployerContribution: false,
              createdBy: userId,
            },
          ],
        },
      },
    });
    generated++;
  }

  return { generated, skipped, totalDays };
}

const PayrollService = {
  async index(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    fiscalYearId?: string;
    yearBs?: number;
  }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: Record<string, unknown> = { deletedAt: null };
    if (query.status) whereClause.status = query.status;
    if (query.fiscalYearId) whereClause.fiscalYearId = query.fiscalYearId;
    if (query.yearBs) whereClause.yearBs = query.yearBs;
    if (query.search) {
      const y = Number(query.search);
      whereClause.OR = Number.isInteger(y)
        ? [{ yearBs: y }, { monthBs: y }]
        : [{ remarks: { contains: query.search, mode: "insensitive" } }];
    }

    const [records, total] = await Promise.all([
      prismaMain.payroll.findMany({
        where: whereClause as never,
        skip,
        take: toPrismaTake(limit),
        include: {
          payslips: { include: { items: true } },
          journalEntry: true,
        },
        orderBy: [{ yearBs: "desc" }, { monthBs: "desc" }],
      }),
      prismaMain.payroll.count({ where: whereClause as never }),
    ]);

    return { data: records, pagination: { page, limit, total } };
  },

  async create(data: PayrollCreateInput, userId?: string) {
    const fiscalYear = await prismaMain.fiscalYear.findFirst({
      where: { id: data.fiscalYearId, deletedAt: null },
    });
    if (!fiscalYear) throw new CustomError("Fiscal year not found", 404);

    // Server-computed from the BS month table — client totalDays is ignored.
    const totalDays = getDaysInBsMonth(data.yearBs, data.monthBs);

    return prismaMain
      .$transaction(async (tx) => {
        const payroll = await tx.payroll.create({
          data: {
            fiscalYearId: data.fiscalYearId,
            yearBs: data.yearBs,
            monthBs: data.monthBs,
            totalDays,
            status: "DRAFT",
            createdBy: userId,
          },
        });
        const { generated } = await generatePayslips(tx, payroll, userId);
        const created = await tx.payroll.findUnique({
          where: { id: payroll.id },
          include: {
            payslips: { include: { items: true } },
            journalEntry: true,
          },
        });
        return { ...created, payslipsGenerated: generated };
      })
      .catch((error: unknown) => {
        if ((error as { code?: string }).code === "P2002") {
          throw new CustomError(
            `A payroll already exists for BS ${data.yearBs}-${String(data.monthBs).padStart(2, "0")}`,
            409,
          );
        }
        throw error;
      });
  },

  async getById(id: string) {
    const record = await prismaMain.payroll.findFirst({
      where: { id, deletedAt: null },
      include: { payslips: { include: { items: true } }, journalEntry: true },
    });
    if (!record) throw new CustomError("Payroll not found", 404);
    return record;
  },

  /** Regenerate payslips from current structures/attendance. DRAFT/REJECTED only. */
  async regenerate(id: string, userId?: string) {
    const existing = await prismaMain.payroll.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new CustomError("Payroll not found", 404);
    if (existing.status !== "DRAFT" && existing.status !== "REJECTED") {
      throw new CustomError(
        `Payslips can only be regenerated in DRAFT or REJECTED (current: ${existing.status})`,
        409,
      );
    }
    return prismaMain.$transaction(async (tx) => {
      const { generated } = await generatePayslips(tx, existing, userId);
      await tx.payroll.update({
        where: { id },
        data: {
          totalDays: getDaysInBsMonth(existing.yearBs, existing.monthBs),
          updatedBy: userId,
        },
      });
      const refreshed = await tx.payroll.findUnique({
        where: { id },
        include: { payslips: { include: { items: true } }, journalEntry: true },
      });
      return { ...refreshed, payslipsGenerated: generated };
    });
  },

  async update(id: string, data: PayrollUpdateInput, userId?: string) {
    const existing = await prismaMain.payroll.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new CustomError("Payroll not found", 404);
    if (existing.status !== "DRAFT") {
      throw new CustomError(
        `Payroll can only be edited in DRAFT (current: ${existing.status})`,
        409,
      );
    }
    if (data.fiscalYearId) {
      const fy = await prismaMain.fiscalYear.findFirst({
        where: { id: data.fiscalYearId, deletedAt: null },
      });
      if (!fy) throw new CustomError("Fiscal year not found", 404);
    }
    const yearBs = data.yearBs ?? existing.yearBs;
    const monthBs = data.monthBs ?? existing.monthBs;
    const totalDays = getDaysInBsMonth(yearBs, monthBs);
    try {
      return await prismaMain.payroll.update({
        where: { id },
        data: { ...data, totalDays, updatedBy: userId } as never,
        include: { payslips: { include: { items: true } }, journalEntry: true },
      });
    } catch (error: unknown) {
      if ((error as { code?: string }).code === "P2002") {
        throw new CustomError(
          `A payroll already exists for BS ${yearBs}-${String(monthBs).padStart(2, "0")}`,
          409,
        );
      }
      throw error;
    }
  },

  // -------- Status transitions --------
  async submit(id: string, userId?: string) {
    return this.transition(id, ["DRAFT", "REJECTED"], "PENDING", userId, {
      submittedAt: new Date(),
    });
  },
  async approve(id: string, userId?: string) {
    return this.transition(
      id,
      ["PENDING"],
      "APPROVED",
      userId,
      { approvedBy: userId, approvedAt: new Date() },
      true,
    );
  },
  async reject(id: string, userId?: string) {
    return this.transition(id, ["PENDING"], "REJECTED", userId, {});
  },
  async backToDraft(id: string, userId?: string) {
    return this.transition(id, ["REJECTED"], "DRAFT", userId, {});
  },

  /** APPROVED -> PAID: sets paidDateBs, posts the PAYROLL journal, locks attendance. */
  async pay(id: string, paidDateBs: string, userId?: string) {
    const payroll = await prismaMain.payroll.findFirst({
      where: { id, deletedAt: null },
    });
    if (!payroll) throw new CustomError("Payroll not found", 404);
    if (payroll.status !== "APPROVED") {
      throw new CustomError(
        `Payroll must be APPROVED before payment (current: ${payroll.status})`,
        409,
      );
    }
    if (payroll.journalEntryId)
      throw new CustomError("Payroll already paid (journal exists)", 409);

    return prismaMain
      .$transaction(async (tx) => {
        const payslips = await tx.payslip.findMany({
          where: { payrollId: payroll.id },
          include: { items: true },
        });
        const fiscalYear = await tx.fiscalYear.findFirst({
          where: { id: payroll.fiscalYearId },
        });
        if (!fiscalYear) throw new CustomError("Fiscal year not found", 404);

        const totals = payslips.reduce(
          (s, p) => ({
            gross: s.gross.plus(new Decimal(p.grossPay.toString())),
            net: s.net.plus(new Decimal(p.netPay.toString())),
            tax: s.tax.plus(new Decimal(p.taxAmount.toString())),
            employer: s.employer.plus(
              p.items
                .filter((i) => i.isEmployerContribution)
                .reduce(
                  (a, i) => a.plus(new Decimal(i.amount.toString())),
                  new Decimal(0),
                ),
            ),
            deductions: s.deductions.plus(
              p.items
                .filter(
                  (i) => i.isDeduction && !i.description.includes("Income tax"),
                )
                .reduce(
                  (a, i) => a.plus(new Decimal(i.amount.toString())),
                  new Decimal(0),
                ),
            ),
          }),
          {
            gross: new Decimal(0),
            net: new Decimal(0),
            tax: new Decimal(0),
            employer: new Decimal(0),
            deductions: new Decimal(0),
          },
        );

        const accountByCode = async (code: string, label: string) => {
          const acc = await tx.account.findFirst({
            where: { code, deletedAt: null, isActive: true },
          });
          if (!acc)
            throw new CustomError(
              `Chart of accounts missing '${code}' (${label}) — run prisma seed`,
              500,
            );
          return acc;
        };
        const salaryExpense = await accountByCode("5000", "Salary Expense");
        const salaryPayable = await accountByCode("2000", "Salary Payable");
        const tdsPayable = totals.tax.gt(0)
          ? await accountByCode("2010", "TDS Payable")
          : null;
        const ssfEmployerExpense = totals.employer.gt(0)
          ? await accountByCode("5010", "SSF Employer Expense")
          : null;
        const deductionPayable = totals.deductions.gt(0)
          ? await accountByCode("2020", "SSF/PF/CIT Payable")
          : null;

        const entryNo = await nextEntryNo(tx, fiscalYear.name);
        const entry = await tx.journalEntry.create({
          data: {
            entryNo,
            fiscalYearId: fiscalYear.id,
            dateBs: paidDateBs,
            description: `Payroll ${payroll.yearBs}-${String(payroll.monthBs).padStart(2, "0")} (${payslips.length} payslips)`,
            source: "PAYROLL",
            sourceRefId: payroll.id,
            createdBy: userId,
            lines: {
              create: [
                {
                  accountId: salaryExpense.id,
                  debit: totals.gross,
                  description: "Gross salaries",
                },
                ...(ssfEmployerExpense && totals.employer.gt(0)
                  ? [
                      {
                        accountId: ssfEmployerExpense.id,
                        debit: totals.employer,
                        description: "Employer contributions",
                      },
                    ]
                  : []),
                {
                  accountId: salaryPayable.id,
                  credit: totals.net,
                  description: "Net pay",
                },
                ...(tdsPayable && totals.tax.gt(0)
                  ? [
                      {
                        accountId: tdsPayable.id,
                        credit: totals.tax,
                        description: "TDS payable",
                      },
                    ]
                  : []),
                ...(deductionPayable && totals.deductions.gt(0)
                  ? [
                      {
                        accountId: deductionPayable.id,
                        credit: totals.deductions,
                        description: "SSF/PF/CIT payable (employee)",
                      },
                    ]
                  : []),
              ],
            },
          },
        });

        // Lock the month's employee attendance now that the payroll is final.
        const { startBs, endBs } = bsMonthRange(
          payroll.yearBs,
          payroll.monthBs,
        );
        await tx.employeeAttendance.updateMany({
          where: { deletedAt: null, dateBs: { gte: startBs, lte: endBs } },
          data: { isLocked: true, updatedBy: userId },
        });

        const updated = await tx.payroll.update({
          where: { id },
          data: {
            status: "PAID",
            paidDateBs,
            journalEntryId: entry.id,
            updatedBy: userId,
          },
          include: {
            payslips: { include: { items: true } },
            journalEntry: true,
          },
        });
        return updated;
      })
      .catch((error: unknown) => {
        if (error instanceof CustomError) throw error;
        if ((error as { code?: string }).code === "P2002") {
          throw new CustomError(
            "Journal posting conflict (duplicate entry number) — retry once",
            409,
          );
        }
        throw error;
      });
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.payroll.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new CustomError("Payroll not found", 404);
    if (existing.status === "APPROVED" || existing.status === "PAID") {
      throw new CustomError(
        `Payroll in ${existing.status} cannot be deleted`,
        409,
      );
    }
    await prismaMain.payroll.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
    return null;
  },

  // internal transition helper
  async transition(
    id: string,
    from: string[],
    to: "PENDING" | "APPROVED" | "REJECTED" | "DRAFT",
    userId?: string,
    extra: Record<string, unknown> = {},
    lockAttendance = false,
  ) {
    const existing = await prismaMain.payroll.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new CustomError("Payroll not found", 404);
    if (!from.includes(existing.status)) {
      throw new CustomError(
        `Invalid transition ${existing.status} -> ${to}. Allowed from: ${from.join(", ")}`,
        409,
      );
    }
    return prismaMain.$transaction(async (tx) => {
      const updated = await tx.payroll.update({
        where: { id },
        data: { status: to, ...extra, updatedBy: userId } as never,
        include: { payslips: { include: { items: true } }, journalEntry: true },
      });
      if (lockAttendance) {
        const { startBs, endBs } = bsMonthRange(
          existing.yearBs,
          existing.monthBs,
        );
        await tx.employeeAttendance.updateMany({
          where: { deletedAt: null, dateBs: { gte: startBs, lte: endBs } },
          data: { isLocked: true, updatedBy: userId },
        });
      }
      return updated;
    });
  },
};

export { PayrollService };
