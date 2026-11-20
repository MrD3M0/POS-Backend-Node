"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountantDashboardService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const bs_date_1 = require("@/utils/bs-date");
const money_1 = require("@/lib/money");
/**
 * Accountant dashboard — read-only aggregates for the finance module.
 *
 * Aggregation is expressed with Prisma `groupBy`/`aggregate` and small
 * in-memory merges where a relation field is needed (account type, batch).
 */
const MONTH_LABELS = [
    "Baisakh",
    "Jestha",
    "Ashadh",
    "Shrawan",
    "Bhadra",
    "Ashwin",
    "Kartik",
    "Mangsir",
    "Poush",
    "Magh",
    "Falgun",
    "Chaitra",
];
function monthLabel(yearBs, monthBs) {
    return `${MONTH_LABELS[monthBs - 1] ?? monthBs} ${yearBs}`;
}
function num(value) {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
}
/** Days between two BS dates (BS months have 29-32 days, so convert to AD). */
function daysBetweenBs(fromBs, toBs) {
    const from = (0, bs_date_1.bsToAdString)(fromBs);
    const to = (0, bs_date_1.bsToAdString)(toBs);
    if (!from || !to)
        return 0;
    const ms = new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime();
    return Math.max(0, Math.round(ms / 86_400_000));
}
/**
 * Net outstanding amount per student fee item: `netAmount - sum(allocations)`.
 * Clamping to zero is left to callers because the overdue queries only keep
 * positive remainders while the KPI totals sum `max(remaining, 0)`.
 */
async function outstandingFeeItems() {
    const items = await prismaClient_1.prismaMain.studentFeeItem.findMany({
        where: {
            deletedAt: null,
            isSkipped: false,
            studentFee: { deletedAt: null },
        },
        select: {
            id: true,
            netAmount: true,
            dueDateBs: true,
            studentFeeId: true,
            studentFee: { select: { studentId: true } },
        },
    });
    if (items.length === 0)
        return [];
    const paidRows = await prismaClient_1.prismaMain.feePaymentAllocation.groupBy({
        by: ["studentFeeItemId"],
        where: { studentFeeItemId: { in: items.map((item) => item.id) } },
        _sum: { amount: true },
    });
    const paidByItem = new Map(paidRows.map((row) => [row.studentFeeItemId, row._sum.amount ?? (0, money_1.dec)(0)]));
    return items.map((item) => ({
        id: item.id,
        studentFeeId: item.studentFeeId,
        studentId: item.studentFee.studentId,
        dueDateBs: item.dueDateBs,
        remaining: (0, money_1.dec)(item.netAmount).minus(paidByItem.get(item.id) ?? (0, money_1.dec)(0)),
    }));
}
async function journalTotalsByAccount(where) {
    const grouped = await prismaClient_1.prismaMain.journalLine.groupBy({
        by: ["accountId"],
        where,
        _sum: { debit: true, credit: true },
    });
    if (grouped.length === 0)
        return [];
    const accounts = await prismaClient_1.prismaMain.account.findMany({
        where: { id: { in: grouped.map((row) => row.accountId) } },
        select: { id: true, code: true, name: true, type: true },
    });
    const accountById = new Map(accounts.map((account) => [account.id, account]));
    return grouped.flatMap((row) => {
        const account = accountById.get(row.accountId);
        if (!account)
            return [];
        return [
            {
                account,
                debit: row._sum.debit ?? (0, money_1.dec)(0),
                credit: row._sum.credit ?? (0, money_1.dec)(0),
            },
        ];
    });
}
exports.AccountantDashboardService = {
    /** KPI cards: collections, outstanding fees, expenses, payroll, cash. */
    async kpis() {
        const today = (0, bs_date_1.todayBs)();
        const now = today ? { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) } : null;
        const month = now ? (0, bs_date_1.bsMonthRange)(now.year, now.month) : null;
        const [todayPayment, monthPayment, outstandingItems, expenseTotals, payrollRows, balances] = await Promise.all([
            today
                ? prismaClient_1.prismaMain.feePayment.aggregate({
                    where: { paymentDateBs: today, isCancelled: false },
                    _sum: { totalAmount: true },
                })
                : Promise.resolve({ _sum: { totalAmount: null } }),
            month
                ? prismaClient_1.prismaMain.feePayment.aggregate({
                    where: {
                        paymentDateBs: { gte: month.startBs, lte: month.endBs },
                        isCancelled: false,
                    },
                    _sum: { totalAmount: true },
                })
                : Promise.resolve({ _sum: { totalAmount: null } }),
            outstandingFeeItems(),
            month
                ? journalTotalsByAccount({
                    journalEntry: {
                        dateBs: { gte: month.startBs, lte: month.endBs },
                    },
                })
                : Promise.resolve([]),
            now
                ? prismaClient_1.prismaMain.payroll.findMany({
                    where: {
                        yearBs: now.year,
                        monthBs: now.month,
                        deletedAt: null,
                    },
                    select: {
                        id: true,
                        status: true,
                        payslips: { select: { grossPay: true } },
                    },
                })
                : Promise.resolve([]),
            journalTotalsByAccount({
                account: { code: { in: ["1000", "1100"] }, deletedAt: null },
            }),
        ]);
        // Cash vs bank split of today's collection.
        const todayMethods = today
            ? await prismaClient_1.prismaMain.feePaymentMethodLine.groupBy({
                by: ["paymentMethodId"],
                where: {
                    feePayment: { paymentDateBs: today, isCancelled: false },
                },
                _sum: { amount: true },
            })
            : [];
        const todayMethodIds = todayMethods.map((row) => row.paymentMethodId);
        const todayPaymentMethods = todayMethodIds.length
            ? await prismaClient_1.prismaMain.paymentMethod.findMany({
                where: { id: { in: todayMethodIds } },
                select: { id: true, code: true },
            })
            : [];
        const methodCodeById = new Map(todayPaymentMethods.map((method) => [method.id, method.code]));
        let cash = 0;
        let bank = 0;
        for (const row of todayMethods) {
            const code = methodCodeById.get(row.paymentMethodId);
            if (code === "CASH")
                cash += num(row._sum.amount);
            else
                bank += num(row._sum.amount);
        }
        const splitRows = today
            ? await prismaClient_1.prismaMain.feePayment.findMany({
                where: {
                    paymentDateBs: today,
                    isCancelled: false,
                    methodLines: { some: {} },
                },
                select: { id: true, _count: { select: { methodLines: true } } },
            })
            : [];
        const totalOutstanding = (0, money_1.sumMoney)(outstandingItems.map((item) => (item.remaining.gt(0) ? item.remaining : (0, money_1.dec)(0))));
        const payrollRow = payrollRows[0];
        return {
            todayBs: today,
            month: now
                ? { yearBs: now.year, monthBs: now.month, label: monthLabel(now.year, now.month) }
                : null,
            collectionToday: {
                total: num(todayPayment._sum.totalAmount),
                cash,
                bank,
                split: splitRows.filter((row) => row._count.methodLines > 1).length,
            },
            collectionMonth: { total: num(monthPayment._sum.totalAmount) },
            outstanding: {
                total: num(totalOutstanding),
                students: new Set(outstandingItems.map((item) => item.studentFeeId)).size,
            },
            expensesMonth: {
                total: num((0, money_1.sumMoney)(expenseTotals
                    .filter((row) => row.account.type === "EXPENSE")
                    .map((row) => row.debit.minus(row.credit)))),
            },
            payroll: {
                status: payrollRow?.status ?? "NOT_STARTED",
                payslips: payrollRow?.payslips.length ?? 0,
                gross: num((0, money_1.sumMoney)((payrollRow?.payslips ?? []).map((slip) => slip.grossPay))),
                yearBs: now?.year ?? null,
                monthBs: now?.month ?? null,
            },
            cash: {
                cashInHand: num(balances.find((row) => row.account.code === "1000")?.debit.minus(balances.find((row) => row.account.code === "1000")?.credit ?? (0, money_1.dec)(0))),
                bankBalance: num(balances.find((row) => row.account.code === "1100")?.debit.minus(balances.find((row) => row.account.code === "1100")?.credit ?? (0, money_1.dec)(0))),
            },
        };
    },
    /** Fee collection trend (by BS month) + pending fees per batch. */
    async feeAnalytics() {
        const today = (0, bs_date_1.todayBs)();
        const year = today ? Number(today.slice(0, 4)) : null;
        const payments = year
            ? await prismaClient_1.prismaMain.feePayment.findMany({
                where: {
                    paymentDateBs: { gte: `${year - 1}-01` },
                    isCancelled: false,
                },
                select: { paymentDateBs: true, totalAmount: true },
            })
            : [];
        const trendByMonth = new Map();
        for (const payment of payments) {
            const month = payment.paymentDateBs.slice(0, 7);
            trendByMonth.set(month, (trendByMonth.get(month) ?? (0, money_1.dec)(0)).plus(payment.totalAmount));
        }
        const trend = [...trendByMonth.entries()]
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([month, total]) => ({ month, total }));
        const items = await outstandingFeeItems();
        const positive = items.filter((item) => item.remaining.gt(0));
        const students = positive.length
            ? await prismaClient_1.prismaMain.student.findMany({
                where: { id: { in: [...new Set(positive.map((item) => item.studentId))] } },
                select: {
                    id: true,
                    batchId: true,
                    batch: {
                        select: { name: true, course: { select: { name: true } } },
                    },
                },
            })
            : [];
        const studentById = new Map(students.map((student) => [student.id, student]));
        const byBatch = new Map();
        for (const item of items) {
            const student = studentById.get(item.studentId);
            if (!student)
                continue;
            const current = byBatch.get(student.batchId) ?? {
                batchId: student.batchId,
                batch: student.batch.name,
                course: student.batch.course.name,
                due: (0, money_1.dec)(0),
                students: new Set(),
            };
            current.due = current.due.plus(item.remaining.gt(0) ? item.remaining : (0, money_1.dec)(0));
            current.students.add(item.studentId);
            byBatch.set(student.batchId, current);
        }
        return {
            trend: trend.map((row) => {
                const [y, m] = row.month.split("-");
                return {
                    month: row.month,
                    label: monthLabel(Number(y), Number(m)),
                    total: num(row.total),
                };
            }),
            pendingByBatch: [...byBatch.values()]
                .sort((a, b) => b.due.comparedTo(a.due))
                .slice(0, 10)
                .map((row) => ({
                batchId: row.batchId,
                batch: row.batch,
                course: row.course,
                due: num(row.due),
                students: row.students.size,
            })),
        };
    },
    /** Recent receipts + the students that are overdue. */
    async collections() {
        const today = (0, bs_date_1.todayBs)();
        const payments = await prismaClient_1.prismaMain.feePayment.findMany({
            select: {
                id: true,
                receiptNo: true,
                paymentDateBs: true,
                totalAmount: true,
                isCancelled: true,
                student: {
                    select: {
                        universityRegNo: true,
                        firstName: true,
                        middleName: true,
                        lastName: true,
                        batch: { select: { name: true } },
                    },
                },
                methodLines: { select: { paymentMethod: { select: { code: true } } } },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
        });
        const items = today ? await outstandingFeeItems() : [];
        const overdueItems = items.filter((item) => item.dueDateBs !== null &&
            item.dueDateBs < today &&
            item.remaining.gt(0));
        const overdueStudentIds = [...new Set(overdueItems.map((item) => item.studentId))];
        const overdueStudents = overdueStudentIds.length
            ? await prismaClient_1.prismaMain.student.findMany({
                where: { id: { in: overdueStudentIds } },
                select: {
                    id: true,
                    universityRegNo: true,
                    firstName: true,
                    middleName: true,
                    lastName: true,
                    batch: { select: { name: true } },
                },
            })
            : [];
        const overdueStudentById = new Map(overdueStudents.map((student) => [student.id, student]));
        const overdueByStudent = new Map();
        for (const item of overdueItems) {
            const current = overdueByStudent.get(item.studentId) ?? {
                due: (0, money_1.dec)(0),
                oldestDueBs: item.dueDateBs,
            };
            current.due = current.due.plus(item.remaining);
            if (item.dueDateBs && item.dueDateBs < current.oldestDueBs) {
                current.oldestDueBs = item.dueDateBs;
            }
            overdueByStudent.set(item.studentId, current);
        }
        return {
            recentPayments: payments.map((row) => {
                const student = row.student;
                return {
                    id: row.id,
                    receiptNo: row.receiptNo,
                    paymentDateBs: row.paymentDateBs,
                    totalAmount: num(row.totalAmount),
                    isCancelled: row.isCancelled,
                    student: [student.firstName, student.middleName, student.lastName]
                        .filter(Boolean)
                        .join(" "),
                    universityRegNo: student.universityRegNo,
                    batch: student.batch.name,
                    methods: row.methodLines
                        .map((line) => line.paymentMethod.code)
                        .join(","),
                    isSplit: row.methodLines.length > 1,
                };
            }),
            overdueStudents: [...overdueByStudent.entries()]
                .flatMap(([studentId, totals]) => {
                const student = overdueStudentById.get(studentId);
                if (!student)
                    return [];
                return [
                    {
                        studentId,
                        name: [student.firstName, student.middleName, student.lastName]
                            .filter(Boolean)
                            .join(" "),
                        universityRegNo: student.universityRegNo,
                        batch: student.batch.name,
                        dueAmount: num(totals.due),
                        oldestDueBs: totals.oldestDueBs,
                        daysOverdue: daysBetweenBs(totals.oldestDueBs, today ?? totals.oldestDueBs),
                    },
                ];
            })
                .sort((a, b) => b.dueAmount - a.dueAmount)
                .slice(0, 10),
        };
    },
    /** Recent journal entries + trial balance + balance sheet snapshot. */
    async journal() {
        const recent = await prismaClient_1.prismaMain.journalEntry.findMany({
            select: {
                id: true,
                entryNo: true,
                dateBs: true,
                description: true,
                createdBy: true,
                lines: { select: { debit: true, credit: true } },
            },
            orderBy: [{ dateBs: "desc" }, { createdAt: "desc" }],
            take: 10,
        });
        const creatorIds = [
            ...new Set(recent.map((row) => row.createdBy).filter(Boolean)),
        ];
        const creators = creatorIds.length
            ? await prismaClient_1.prismaMain.user.findMany({
                where: { id: { in: creatorIds } },
                select: { id: true, email: true },
            })
            : [];
        const emailById = new Map(creators.map((user) => [user.id, user.email]));
        const totals = await prismaClient_1.prismaMain.journalLine.aggregate({
            _sum: { debit: true, credit: true },
        });
        const byType = await journalTotalsByAccount({
            account: { deletedAt: null },
        });
        const sumType = (type) => num((0, money_1.sumMoney)(byType
            .filter((row) => row.account.type === type)
            .map((row) => row.debit.minus(row.credit))));
        return {
            recentEntries: recent.map((row) => ({
                id: row.id,
                entryNo: row.entryNo,
                dateBs: row.dateBs,
                description: row.description,
                debit: num((0, money_1.sumMoney)(row.lines.map((line) => line.debit))),
                credit: num((0, money_1.sumMoney)(row.lines.map((line) => line.credit))),
                createdBy: row.createdBy ? emailById.get(row.createdBy) ?? null : null,
            })),
            trialBalance: {
                debit: num(totals._sum.debit),
                credit: num(totals._sum.credit),
                balanced: (0, money_1.moneyEq)((0, money_1.dec)(totals._sum.debit ?? 0), (0, money_1.dec)(totals._sum.credit ?? 0)),
            },
            balanceSheet: {
                assets: sumType("ASSET"),
                liabilities: sumType("LIABILITY"),
                equity: sumType("EQUITY"),
            },
        };
    },
    /** Payroll summary of the current month + the alerts that need attention. */
    async payrollAndAlerts() {
        const today = (0, bs_date_1.todayBs)();
        const now = today
            ? { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) }
            : null;
        const payrollRows = now
            ? await prismaClient_1.prismaMain.payroll.findMany({
                where: {
                    yearBs: now.year,
                    monthBs: now.month,
                    deletedAt: null,
                },
                select: {
                    id: true,
                    status: true,
                    payslips: {
                        select: {
                            grossPay: true,
                            attendanceDeduction: true,
                            netPay: true,
                        },
                    },
                },
            })
            : [];
        const row = payrollRows[0];
        const [unbalanced, outstandingItems, notices] = await Promise.all([
            prismaClient_1.prismaMain.journalLine.groupBy({
                by: ["journalEntryId"],
                _sum: { debit: true, credit: true },
            }),
            outstandingFeeItems(),
            prismaClient_1.prismaMain.notice.findMany({
                where: { deletedAt: null },
                select: { id: true, title: true, createdAt: true, createdBy: true },
                orderBy: { createdAt: "desc" },
                take: 5,
            }),
        ]);
        const unbalancedCount = unbalanced.filter((entry) => !(0, money_1.moneyEq)((0, money_1.dec)(entry._sum.debit ?? 0), (0, money_1.dec)(entry._sum.credit ?? 0))).length;
        const defaulters = new Set(outstandingItems
            .filter((item) => item.remaining.gt(0))
            .map((item) => item.studentFeeId)).size;
        const noticeCreatorIds = [
            ...new Set(notices.map((notice) => notice.createdBy).filter(Boolean)),
        ];
        const noticeCreators = noticeCreatorIds.length
            ? await prismaClient_1.prismaMain.user.findMany({
                where: { id: { in: noticeCreatorIds } },
                select: { id: true, role: true },
            })
            : [];
        const roleById = new Map(noticeCreators.map((user) => [user.id, user.role]));
        const status = row?.status ?? "NOT_STARTED";
        const alerts = [];
        if (unbalancedCount > 0) {
            alerts.push({
                key: "unbalanced-journals",
                label: "Unbalanced journal entries",
                severity: "error",
                count: unbalancedCount,
                link: "/accountant/journal",
            });
        }
        if (defaulters > 0) {
            alerts.push({
                key: "defaulters",
                label: "Students with outstanding fees",
                severity: "warning",
                count: defaulters,
                link: "/accountant/billing",
            });
        }
        if (status === "PENDING") {
            alerts.push({
                key: "payroll-approval",
                label: "Payroll waiting for the principal",
                severity: "warning",
                count: 1,
                link: "/principal/payroll/pending",
            });
        }
        if (status === "REJECTED") {
            alerts.push({
                key: "payroll-rejected",
                label: "Payroll was rejected by the principal",
                severity: "error",
                count: 1,
                link: "/accountant/payroll/wizard",
            });
        }
        const slips = row?.payslips ?? [];
        return {
            payroll: {
                status,
                yearBs: now?.year ?? null,
                monthBs: now?.month ?? null,
                gross: num((0, money_1.sumMoney)(slips.map((slip) => slip.grossPay))),
                deduction: num((0, money_1.sumMoney)(slips.map((slip) => slip.attendanceDeduction))),
                net: num((0, money_1.sumMoney)(slips.map((slip) => slip.netPay))),
                payslipsGenerated: slips.length,
                payslipsPending: 0,
            },
            alerts,
            notices: notices.map((notice) => ({
                id: notice.id,
                title: notice.title,
                createdAt: notice.createdAt,
                role: notice.createdBy
                    ? roleById.get(notice.createdBy) ?? null
                    : null,
            })),
        };
    },
};
