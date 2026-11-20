import { prismaMain } from "@/lib/prismaClient";
import { getSettingValue, SETTING_REGISTRY, SETTING_KEYS } from "@/lib/settings";
import { todayBs } from "@/utils/bs-date";
import { dec, moneyEq } from "@/lib/money";

export const REQUIRED_SYSTEM_ACCOUNTS = [
  { code: "1000", name: "Cash", type: "ASSET" },
  { code: "1100", name: "Bank", type: "ASSET" },
  { code: "1200", name: "Accounts Receivable", type: "ASSET" },
  { code: "2100", name: "SSF Payable", type: "LIABILITY" },
  { code: "2110", name: "PF Payable", type: "LIABILITY" },
  { code: "2120", name: "TDS Payable", type: "LIABILITY" },
  { code: "3000", name: "Equity", type: "EQUITY" },
  { code: "FEE-INCOME", name: "Fee Income", type: "INCOME" },
  { code: "5000", name: "Salary Expense", type: "EXPENSE" },
] as const;

export const REQUIRED_SETTING_KEYS = ["ATTENDANCE_EDIT_HOURS", "WORKING_DAYS_MODE"];

export type T_SetupWarning = {
  key: string;
  label: string;
  count: number;
  fixPath: string;
  severity: "warning" | "error";
};

async function countOrZero(fn: () => Promise<number>): Promise<number> {
  try {
    return await fn();
  } catch {
    return 0;
  }
}

async function gradeScaleIssues(): Promise<{ problematicRows: number; ok: boolean }> {
  const rows = await prismaMain.gradeScale.findMany({
    where: { deletedAt: null, isActive: true },
    orderBy: { minPercent: "asc" },
    select: { grade: true, minPercent: true, maxPercent: true },
  });
  if (rows.length === 0) return { problematicRows: 0, ok: false };

  let problematic = 0;
  const sorted = rows.map((row) => ({
    min: Number(row.minPercent),
    max: Number(row.maxPercent),
  }));
  if (sorted[0].min !== 0) problematic += 1;
  if (sorted[sorted.length - 1].max !== 100) problematic += 1;
  for (let i = 0; i < sorted.length; i += 1) {
    if (sorted[i].max < sorted[i].min) problematic += 1;
    if (i > 0 && sorted[i].min !== sorted[i - 1].max) problematic += 1;
  }
  return { problematicRows: problematic, ok: problematic === 0 };
}

export const AdminDashboardService = {
  async overview() {
    const today = todayBs();

    const [
      activeStudents,
      pendingStudents,
      teachers,
      staff,
      accountants,
      principals,
      activeBatches,
      activeCourses,
      lockedAccounts,
      currentFiscalYear,
      activePeriods,
      activeFeeHeads,
      activeGradeScales,
      paymentMethods,
      systemAccounts,
      storedSettings,
      batchesWithoutTerms,
      termsWithoutSubjects,
      subjectsWithoutTeacher,
      teachersWithoutAssignment,
      recentActivity,
      recentLogins,
      todayHoliday,
    ] = await Promise.all([
      prismaMain.student.count({
        where: { status: "ACTIVE", approvalStatus: "APPROVED", deletedAt: null },
      }),
      prismaMain.student.count({ where: { approvalStatus: "PENDING", deletedAt: null } }),
      prismaMain.teacher.count({ where: { deletedAt: null, employee: { isActive: true, deletedAt: null } } }),
      prismaMain.staff.count({ where: { deletedAt: null, employee: { isActive: true, deletedAt: null } } }),
      prismaMain.accountant.count({ where: { deletedAt: null, employee: { isActive: true, deletedAt: null } } }),
      prismaMain.principal.count({ where: { deletedAt: null, employee: { isActive: true, deletedAt: null } } }),
      prismaMain.batch.count({ where: { isActive: true, deletedAt: null } }),
      prismaMain.course.count({ where: { isActive: true, deletedAt: null } }),
      prismaMain.user.count({
        where: { deletedAt: null, OR: [{ lockedUntil: { gt: new Date() } }, { failedLoginCount: { gte: 5 } }] },
      }),
      prismaMain.fiscalYear.findFirst({ where: { isCurrent: true, deletedAt: null } }),
      prismaMain.period.count({ where: { isActive: true, deletedAt: null } }),
      prismaMain.feeHead.count({ where: { isActive: true, deletedAt: null } }),
      prismaMain.gradeScale.count({ where: { isActive: true, deletedAt: null } }),
      prismaMain.paymentMethod.count({ where: { deletedAt: null, isActive: true } }),
      prismaMain.account.findMany({
        where: { deletedAt: null, isActive: true },
        select: { code: true },
      }),
      prismaMain.setting.findMany({ where: { deletedAt: null }, select: { key: true } }),
      countOrZero(() =>
        prismaMain.batch.count({
          where: { deletedAt: null, isActive: true, terms: { none: { deletedAt: null } } },
        }),
      ),
      countOrZero(() =>
        prismaMain.batchTerm.count({
          where: { deletedAt: null, isActive: true, batch: { deletedAt: null }, subjects: { none: { deletedAt: null } } },
        }),
      ),
      countOrZero(() =>
        prismaMain.batchTermSubject.count({
          where: { deletedAt: null, subject: { deletedAt: null }, assignments: { none: { deletedAt: null, isActive: true } } },
        }),
      ),
      countOrZero(() =>
        prismaMain.teacher.count({
          where: { deletedAt: null, employee: { isActive: true, deletedAt: null }, assignments: { none: { deletedAt: null, isActive: true } } },
        }),
      ),
      prismaMain.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, entity: true, entityId: true, action: true, userId: true, createdAt: true },
      }),
      prismaMain.user.findMany({
        where: { lastLoginAt: { not: null }, deletedAt: null },
        orderBy: { lastLoginAt: "desc" },
        take: 5,
        select: { id: true, email: true, role: true, lastLoginAt: true },
      }),
      today ? prismaMain.holiday.findFirst({ where: { dateBs: today, deletedAt: null } }).catch(() => null) : Promise.resolve(null),
    ]);

    const missingAccounts = REQUIRED_SYSTEM_ACCOUNTS.filter(
      (required) => !systemAccounts.some((account) => account.code === required.code),
    );
    const storedKeys = new Set(storedSettings.map((row) => row.key));
    const missingSettings = REQUIRED_SETTING_KEYS.filter((key) => !storedKeys.has(key));
    const paymentMethodsWithoutAccount = await countOrZero(() =>
      prismaMain.paymentMethod.count({
        where: {
          deletedAt: null,
          isActive: true,
          OR: [{ accountId: null }, { account: { isActive: false, deletedAt: null } }],
        },
      }),
    );
    const gradeScale = await gradeScaleIssues();

    const warnings: T_SetupWarning[] = [];
    if (!currentFiscalYear) {
      warnings.push({ key: "fiscal-year", label: "No current fiscal year is set", count: 1, fixPath: "/admin/fiscal-years", severity: "error" });
    }
    if (activePeriods === 0) {
      warnings.push({ key: "periods", label: "No active class periods", count: 1, fixPath: "/admin/lookups?type=period", severity: "error" });
    }
    if (activeGradeScales === 0 || !gradeScale.ok) {
      warnings.push({
        key: "grade-scale",
        label: activeGradeScales === 0 ? "Grade scale is empty" : "Grade scale has gaps or overlaps",
        count: activeGradeScales === 0 ? 1 : gradeScale.problematicRows,
        fixPath: "/admin/lookups?type=gradeScale",
        severity: "error",
      });
    }
    if (paymentMethodsWithoutAccount > 0) {
      warnings.push({ key: "payment-method-account", label: "Payment methods without a ledger account", count: paymentMethodsWithoutAccount, fixPath: "/admin/lookups?type=paymentMethod", severity: "error" });
    }
    if (activeFeeHeads === 0) {
      warnings.push({ key: "fee-heads", label: "No fee heads configured", count: 1, fixPath: "/admin/lookups?type=feeHead", severity: "warning" });
    }
    if (missingAccounts.length > 0) {
      warnings.push({ key: "system-accounts", label: "Required system accounts are missing", count: missingAccounts.length, fixPath: "/admin/accounts", severity: "error" });
    }
    if (missingSettings.length > 0) {
      warnings.push({ key: "settings", label: "Required setting keys have not been saved", count: missingSettings.length, fixPath: "/admin/settings", severity: "warning" });
    }
    if (batchesWithoutTerms > 0) {
      warnings.push({ key: "batch-terms", label: "Batches without terms", count: batchesWithoutTerms, fixPath: "/admin/batches", severity: "error" });
    }
    if (termsWithoutSubjects > 0) {
      warnings.push({ key: "term-subjects", label: "Terms without subjects", count: termsWithoutSubjects, fixPath: "/admin/batches", severity: "warning" });
    }
    if (subjectsWithoutTeacher > 0) {
      warnings.push({ key: "unassigned-subjects", label: "Subjects without a teacher", count: subjectsWithoutTeacher, fixPath: "/admin/teaching-assignments", severity: "warning" });
    }
    if (teachersWithoutAssignment > 0) {
      warnings.push({ key: "idle-teachers", label: "Teachers with no active assignment", count: teachersWithoutAssignment, fixPath: "/admin/teaching-assignments", severity: "warning" });
    }
    if (paymentMethods === 0) {
      warnings.push({ key: "payment-methods", label: "No payment methods configured", count: 1, fixPath: "/admin/lookups?type=paymentMethod", severity: "warning" });
    }

    const activityUserIds = [...new Set(recentActivity.map((row) => row.userId).filter(Boolean))] as string[];
    const activityUsers = activityUserIds.length
      ? await prismaMain.user.findMany({
          where: { id: { in: activityUserIds } },
          select: { id: true, email: true, role: true },
        })
      : [];
    const activityUserMap = new Map(activityUsers.map((user) => [user.id, user]));

    return {
      todayBs: today,
      holidayToday: todayHoliday,
      counters: {
        activeStudents,
        pendingStudents,
        employees: { teachers, staff, accountants, principals },
        activeBatches,
        activeCourses,
        lockedAccounts,
      },
      warnings,
      recentActivity: recentActivity.map((row) => ({
        ...row,
        user: row.userId ? activityUserMap.get(row.userId) ?? null : null,
      })),
      recentLogins,
      settings: {
        attendanceEditHours: await getSettingValue("ATTENDANCE_EDIT_HOURS"),
        workingDaysMode: await getSettingValue("WORKING_DAYS_MODE"),
        knownKeys: SETTING_KEYS.length,
        registryGroups: Object.values(SETTING_REGISTRY).reduce<Record<string, number>>((acc, def) => {
          acc[def.group] = (acc[def.group] ?? 0) + 1;
          return acc;
        }, {}),
      },
    };
  },

  async healthChecks() {
    const checks: Array<{
      key: string;
      label: string;
      count: number;
      severity: "ok" | "warning" | "error";
      fixPath: string;
    }> = [];

    const studentsWithoutGuardian = await countOrZero(() =>
      prismaMain.student.count({
        where: { deletedAt: null, approvalStatus: "APPROVED", guardians: { none: { deletedAt: null } } },
      }),
    );
    checks.push({
      key: "students-without-guardian",
      label: "Approved students without a guardian",
      count: studentsWithoutGuardian,
      severity: studentsWithoutGuardian > 0 ? "warning" : "ok",
      fixPath: "/admin/students?approvalStatus=APPROVED",
    });

    const employeesWithoutUser = await countOrZero(() =>
      prismaMain.employee.count({ where: { deletedAt: null, isActive: true, userId: null } }),
    );
    checks.push({
      key: "employees-without-user",
      label: "Active employees without a user account",
      count: employeesWithoutUser,
      severity: employeesWithoutUser > 0 ? "warning" : "ok",
      fixPath: "/admin/employees",
    });

    const studentsWithoutFees = await countOrZero(() =>
      prismaMain.student.count({
        where: { deletedAt: null, approvalStatus: "APPROVED", status: "ACTIVE", fees: { none: { deletedAt: null } } },
      }),
    );
    checks.push({
      key: "students-without-fees",
      label: "Approved students without a fee assignment",
      count: studentsWithoutFees,
      severity: studentsWithoutFees > 0 ? "warning" : "ok",
      fixPath: "/admin/students?approvalStatus=APPROVED",
    });

    const batchesWithoutCurrentSubjects = await countOrZero(async () => {
      const batches = await prismaMain.batch.findMany({
        where: { deletedAt: null, isActive: true },
        select: { id: true, currentTermNumber: true },
      });
      if (batches.length === 0) return 0;
      let count = 0;
      for (const batch of batches) {
        const term = await prismaMain.batchTerm.findFirst({
          where: { batchId: batch.id, termNumber: batch.currentTermNumber, deletedAt: null },
          select: { id: true, _count: { select: { subjects: true } } },
        });
        if (!term || term._count.subjects === 0) count += 1;
      }
      return count;
    });
    checks.push({
      key: "batch-current-term-subjects",
      label: "Batches without subjects in their current term",
      count: batchesWithoutCurrentSubjects,
      severity: batchesWithoutCurrentSubjects > 0 ? "warning" : "ok",
      fixPath: "/admin/batches",
    });

    const paymentMethodsWithoutAccounts = await countOrZero(() =>
      prismaMain.paymentMethod.count({
        where: { deletedAt: null, isActive: true, accountId: null },
      }),
    );
    checks.push({
      key: "payment-methods-without-accounts",
      label: "Payment methods without a ledger account",
      count: paymentMethodsWithoutAccounts,
      severity: paymentMethodsWithoutAccounts > 0 ? "error" : "ok",
      fixPath: "/admin/lookups?type=paymentMethod",
    });

    const unbalancedJournals = await countOrZero(async () => {
      const sums = await prismaMain.journalLine.groupBy({
        by: ["journalEntryId"],
        _sum: { debit: true, credit: true },
      });
      return sums.filter(
        (row) =>
          !moneyEq(
            dec(row._sum.debit ?? 0),
            dec(row._sum.credit ?? 0),
          ),
      ).length;
    });
    checks.push({
      key: "unbalanced-journals",
      label: "Unbalanced journal entries (should always be 0)",
      count: unbalancedJournals,
      severity: unbalancedJournals > 0 ? "error" : "ok",
      fixPath: "/admin/finance/journals",
    });

    const methodLineMismatches = await countOrZero(async () => {
      const [payments, lineTotals] = await Promise.all([
        prismaMain.feePayment.findMany({
          select: { id: true, totalAmount: true },
        }),
        prismaMain.feePaymentMethodLine.groupBy({
          by: ["feePaymentId"],
          _sum: { amount: true },
        }),
      ]);
      const totals = new Map(
        lineTotals.map((row) => [
          row.feePaymentId,
          row._sum.amount ?? dec(0),
        ]),
      );
      return payments.filter(
        (payment) =>
          !moneyEq(dec(payment.totalAmount), dec(totals.get(payment.id) ?? 0)),
      ).length;
    });
    checks.push({
      key: "payment-method-line-total",
      label: "Receipts whose method lines do not add up to the total",
      count: methodLineMismatches,
      severity: methodLineMismatches > 0 ? "error" : "ok",
      fixPath: "/admin/finance/fees",
    });

    return {
      checkedAt: new Date().toISOString(),
      checks,
      failing: checks.filter((check) => check.severity !== "ok").length,
    };
  },
};
