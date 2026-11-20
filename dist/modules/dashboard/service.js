"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const service_1 = require("@/modules/accountant-dashboard/service");
const workflow_1 = require("@/modules/exam-subject/workflow");
const service_2 = require("@/modules/holiday/service");
const audience_1 = require("@/modules/notice/audience");
const bs_date_1 = require("@/utils/bs-date");
const sections_1 = require("@/modules/teacher-dashboard/sections");
const context_1 = require("@/modules/teacher-dashboard/context");
const money_1 = require("@/lib/money");
function num(value) {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
}
function monthLabel(yearBs, monthBs) {
    const labels = [
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
    return `${labels[monthBs - 1] ?? monthBs} ${yearBs}`;
}
function fullName(parts) {
    if (!parts)
        return "—";
    return ([parts.firstName, parts.middleName, parts.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() || "—");
}
function iso(value) {
    if (!value)
        return null;
    return value instanceof Date ? value.toISOString() : value;
}
function todayParts() {
    const today = (0, bs_date_1.todayBs)();
    return {
        today,
        year: today ? Number(today.slice(0, 4)) : null,
        month: today ? Number(today.slice(5, 7)) : null,
    };
}
const EMPTY_STATUS = "NOT_MARKED";
exports.DashboardService = {
    // ── ADMIN ───────────────────────────────────────────────────────────────
    async admin() {
        const { today } = todayParts();
        const [activeStudents, pendingStudents, courses, activeBatches, users, principals, teachers, accountants, staff, pendingRows, studentsByBatch, recentUsers, recentStudents, recentAudit, noFiscalYear, batchesWithoutTerms, termsWithoutSubjects, teachersWithoutAssignment,] = await Promise.all([
            prismaClient_1.prismaMain.student.count({
                where: { deletedAt: null, status: "ACTIVE" },
            }),
            prismaClient_1.prismaMain.student.count({
                where: { deletedAt: null, approvalStatus: "PENDING" },
            }),
            prismaClient_1.prismaMain.course.count({ where: { deletedAt: null } }),
            prismaClient_1.prismaMain.batch.count({ where: { deletedAt: null, isActive: true } }),
            prismaClient_1.prismaMain.user.count({ where: { deletedAt: null } }),
            prismaClient_1.prismaMain.principal.count({ where: { deletedAt: null } }),
            prismaClient_1.prismaMain.teacher.count({ where: { deletedAt: null } }),
            prismaClient_1.prismaMain.accountant.count({ where: { deletedAt: null } }),
            prismaClient_1.prismaMain.staff.count({ where: { deletedAt: null } }),
            prismaClient_1.prismaMain.student.findMany({
                where: { deletedAt: null, approvalStatus: "PENDING" },
                select: {
                    id: true,
                    firstName: true,
                    middleName: true,
                    lastName: true,
                    universityRegNo: true,
                    createdAt: true,
                    batch: {
                        select: { name: true, course: { select: { name: true } } },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: 8,
            }),
            prismaClient_1.prismaMain.batch.findMany({
                where: { deletedAt: null },
                select: {
                    id: true,
                    name: true,
                    course: { select: { name: true } },
                    _count: {
                        select: { students: { where: { deletedAt: null } } },
                    },
                },
                orderBy: { name: "desc" },
            }),
            prismaClient_1.prismaMain.user.findMany({
                where: { deletedAt: null },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: 6,
            }),
            prismaClient_1.prismaMain.student.findMany({
                where: { deletedAt: null },
                select: {
                    id: true,
                    firstName: true,
                    middleName: true,
                    lastName: true,
                    universityRegNo: true,
                    createdAt: true,
                    batch: { select: { name: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 6,
            }),
            prismaClient_1.prismaMain.auditLog.findMany({
                select: {
                    id: true,
                    entity: true,
                    entityId: true,
                    action: true,
                    userId: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: 8,
            }),
            prismaClient_1.prismaMain.fiscalYear.count({
                where: { isCurrent: true, deletedAt: null },
            }),
            prismaClient_1.prismaMain.batch.count({
                where: {
                    deletedAt: null,
                    terms: { none: { deletedAt: null } },
                },
            }),
            prismaClient_1.prismaMain.batchTerm.count({
                where: {
                    deletedAt: null,
                    subjects: { none: { deletedAt: null } },
                },
            }),
            prismaClient_1.prismaMain.teacher.count({
                where: {
                    deletedAt: null,
                    assignments: { none: { deletedAt: null } },
                },
            }),
        ]);
        const warnings = [];
        if (noFiscalYear === 0) {
            warnings.push({
                key: "no-current-fiscal-year",
                label: "No current fiscal year is set",
                count: 1,
                severity: "error",
                link: "/admin/fiscal-years",
            });
        }
        if (batchesWithoutTerms > 0) {
            warnings.push({
                key: "batches-without-terms",
                label: "Batches without any term",
                count: batchesWithoutTerms,
                severity: "warning",
                link: "/admin/terms",
            });
        }
        if (termsWithoutSubjects > 0) {
            warnings.push({
                key: "terms-without-subjects",
                label: "Terms without subjects",
                count: termsWithoutSubjects,
                severity: "warning",
                link: "/admin/terms",
            });
        }
        if (teachersWithoutAssignment > 0) {
            warnings.push({
                key: "teachers-without-assignment",
                label: "Teachers without a teaching assignment",
                count: teachersWithoutAssignment,
                severity: "warning",
                link: "/admin/teaching-assignments",
            });
        }
        const byCourse = new Map();
        for (const row of studentsByBatch) {
            const course = row.course.name;
            const current = byCourse.get(course) ?? { course, count: 0 };
            current.count += row._count.students;
            byCourse.set(course, current);
        }
        return {
            todayBs: today,
            counts: {
                activeStudents,
                pendingStudents,
                courses,
                activeBatches,
                users,
                employees: {
                    total: principals + teachers + accountants + staff,
                    principals,
                    teachers,
                    accountants,
                    staff,
                },
            },
            pendingStudents: pendingRows.map((row) => ({
                id: row.id,
                name: fullName(row),
                universityRegNo: row.universityRegNo,
                batch: row.batch.name,
                course: row.batch.course.name,
                createdAt: iso(row.createdAt),
            })),
            charts: {
                studentsPerBatch: studentsByBatch.map((row) => ({
                    batchId: row.id,
                    batch: row.name,
                    course: row.course.name,
                    count: row._count.students,
                })),
                studentsPerCourse: [...byCourse.values()].sort((a, b) => b.count - a.count),
            },
            recentUsers: recentUsers.map((row) => ({
                id: row.id,
                email: row.email,
                role: row.role,
                isActive: row.isActive,
                createdAt: iso(row.createdAt),
            })),
            recentStudents: recentStudents.map((row) => ({
                id: row.id,
                name: fullName(row),
                universityRegNo: row.universityRegNo,
                batch: row.batch.name,
                createdAt: iso(row.createdAt),
            })),
            recentAudit: recentAudit.map((row) => ({
                id: row.id,
                entity: row.entity,
                entityId: row.entityId,
                action: row.action,
                userId: row.userId,
                createdAt: iso(row.createdAt),
            })),
            warnings,
        };
    },
    // ── PRINCIPAL ───────────────────────────────────────────────────────────
    async principal(actor) {
        const { today } = todayParts();
        const attendanceByBatch = async (daysAgo) => {
            if (!today)
                return [];
            const rangeEnd = today;
            const fromBs = (0, bs_date_1.shiftBsDays)(rangeEnd, -daysAgo);
            if (!fromBs)
                return [];
            // Sessions on student holidays are not working days: excluded from the
            // batch attendance percentage entirely.
            const holidayDateBs = [
                ...(await (0, service_2.studentHolidayDateBs)({ fromBs, toBs: rangeEnd })),
            ];
            const groups = await prismaClient_1.prismaMain.studentAttendance.groupBy({
                by: ["studentId", "status"],
                where: {
                    deletedAt: null,
                    session: {
                        deletedAt: null,
                        dateBs: {
                            gte: fromBs,
                            lte: rangeEnd,
                            ...(holidayDateBs.length > 0 ? { notIn: holidayDateBs } : {}),
                        },
                    },
                    student: { deletedAt: null },
                },
                _count: { _all: true },
            });
            if (groups.length === 0)
                return [];
            const students = await prismaClient_1.prismaMain.student.findMany({
                where: {
                    id: { in: [...new Set(groups.map((group) => group.studentId))] },
                },
                select: {
                    id: true,
                    batchId: true,
                    batch: {
                        select: { name: true, course: { select: { name: true } } },
                    },
                },
            });
            const studentById = new Map(students.map((student) => [student.id, student]));
            const byBatch = new Map();
            for (const group of groups) {
                const student = studentById.get(group.studentId);
                if (!student)
                    continue;
                const current = byBatch.get(student.batchId) ?? {
                    batchId: student.batchId,
                    batch: student.batch.name,
                    course: student.batch.course.name,
                    total: 0,
                    present: 0,
                };
                const count = group._count._all;
                current.total += count;
                if (group.status === "PRESENT" || group.status === "LATE") {
                    current.present += count;
                }
                byBatch.set(student.batchId, current);
            }
            return [...byBatch.values()];
        };
        const latestPublishedExam = async () => {
            const groups = await prismaClient_1.prismaMain.result.groupBy({
                by: ["examId"],
                where: { deletedAt: null, status: "PUBLISHED" },
                _max: { publishedAt: true },
                _count: { _all: true },
            });
            const latest = [...groups].sort((a, b) => {
                const left = a._max.publishedAt?.getTime() ?? -Infinity;
                const right = b._max.publishedAt?.getTime() ?? -Infinity;
                return right - left;
            })[0];
            if (!latest)
                return [];
            const [exam, passed] = await Promise.all([
                prismaClient_1.prismaMain.exam.findUnique({
                    where: { id: latest.examId },
                    select: {
                        id: true,
                        name: true,
                        batchTerm: {
                            select: {
                                name: true,
                                batch: { select: { name: true } },
                            },
                        },
                    },
                }),
                prismaClient_1.prismaMain.result.count({
                    where: {
                        examId: latest.examId,
                        deletedAt: null,
                        status: "PUBLISHED",
                        isPassed: true,
                    },
                }),
            ]);
            if (!exam)
                return [];
            return [
                {
                    examId: exam.id,
                    examName: exam.name,
                    batch: exam.batchTerm.batch.name,
                    term: exam.batchTerm.name,
                    publishedAt: latest._max.publishedAt,
                    total: latest._count._all,
                    passed,
                },
            ];
        };
        const latestPublishedResults = async () => {
            const rows = await prismaClient_1.prismaMain.result.findMany({
                where: { deletedAt: null, status: "PUBLISHED" },
                select: {
                    id: true,
                    examId: true,
                    percentage: true,
                    gpa: true,
                    isPassed: true,
                    publishedAt: true,
                    student: {
                        select: { firstName: true, middleName: true, lastName: true },
                    },
                    exam: {
                        select: {
                            name: true,
                            batchTerm: {
                                select: {
                                    name: true,
                                    batch: { select: { name: true } },
                                },
                            },
                        },
                    },
                },
                orderBy: { publishedAt: { sort: "desc", nulls: "last" } },
                take: 8,
            });
            return rows.map((row) => ({
                id: row.id,
                examId: row.examId,
                examName: row.exam.name,
                batch: row.exam.batchTerm.batch.name,
                term: row.exam.batchTerm.name,
                student: fullName(row.student),
                percentage: row.percentage,
                gpa: row.gpa,
                isPassed: row.isPassed,
                publishedAt: row.publishedAt,
            }));
        };
        const [groups, pendingGroups, pendingPayrolls, pendingPayrollCount, noticeDrafts, noticeDraftCount, employeeAttendance, totalEmployees, attendance7, attendance30, latestExam, latestResultRows, latestNotices,] = await Promise.all([
            workflow_1.ExamSubjectWorkflow.groups({ status: "PENDING", page: 1, limit: 20 }, actor),
            prismaClient_1.prismaMain.examSubject.count({
                where: { deletedAt: null, status: "PENDING" },
            }),
            prismaClient_1.prismaMain.payroll.findMany({
                where: { deletedAt: null, status: "PENDING" },
                select: {
                    id: true,
                    yearBs: true,
                    monthBs: true,
                    status: true,
                    payslips: { select: { grossPay: true } },
                },
                orderBy: [{ yearBs: "desc" }, { monthBs: "desc" }],
                take: 10,
            }),
            prismaClient_1.prismaMain.payroll.count({
                where: { deletedAt: null, status: "PENDING" },
            }),
            prismaClient_1.prismaMain.notice.findMany({
                where: { isPublished: false, deletedAt: null },
                select: { id: true, title: true, createdAt: true, createdBy: true },
                orderBy: { createdAt: "desc" },
                take: 6,
            }),
            prismaClient_1.prismaMain.notice.count({
                where: { isPublished: false, deletedAt: null },
            }),
            today
                ? prismaClient_1.prismaMain.employeeAttendance.groupBy({
                    by: ["status"],
                    where: { deletedAt: null, dateBs: today },
                    _count: { _all: true },
                })
                : Promise.resolve([]),
            prismaClient_1.prismaMain.employee.count({ where: { deletedAt: null, isActive: true } }),
            attendanceByBatch(6),
            attendanceByBatch(29),
            latestPublishedExam(),
            latestPublishedResults(),
            prismaClient_1.prismaMain.notice.findMany({
                where: {
                    isPublished: true,
                    deletedAt: null,
                    ...(await (0, audience_1.buildAudienceClause)(actor)),
                },
                select: { id: true, title: true, publishedAt: true, isPinned: true },
                orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
                take: 6,
            }),
        ]);
        const attendanceByStatus = new Map(employeeAttendance.map((row) => [row.status, row._count._all]));
        const present = attendanceByStatus.get("PRESENT") ?? 0;
        const absent = attendanceByStatus.get("ABSENT") ?? 0;
        const leave = attendanceByStatus.get("LEAVE") ?? 0;
        const late = attendanceByStatus.get("LATE") ?? 0;
        const marked = present + absent + leave + late;
        const sevenByBatch = new Map(attendance7.map((row) => [row.batchId, row]));
        const thirtyByBatch = new Map(attendance30.map((row) => [row.batchId, row]));
        const batchIds = new Set([...sevenByBatch.keys(), ...thirtyByBatch.keys()]);
        const examRow = latestExam[0];
        return {
            todayBs: today,
            needsApproval: {
                count: pendingGroups,
                groups: groups.data,
            },
            payrolls: {
                count: pendingPayrollCount,
                items: pendingPayrolls.map((row) => ({
                    id: row.id,
                    label: monthLabel(Number(row.yearBs), Number(row.monthBs)),
                    yearBs: Number(row.yearBs),
                    monthBs: Number(row.monthBs),
                    status: row.status,
                    payslips: row.payslips.length,
                    gross: num((0, money_1.sumMoney)(row.payslips.map((slip) => slip.grossPay))),
                })),
            },
            noticeDrafts: {
                count: noticeDraftCount,
                items: noticeDrafts.map((row) => ({
                    id: row.id,
                    title: row.title,
                    createdAt: iso(row.createdAt),
                })),
            },
            employeeAttendanceToday: {
                total: totalEmployees,
                present: present + late,
                absent,
                leave,
                notCheckedIn: Math.max(0, totalEmployees - marked),
            },
            studentAttendanceByBatch: [...batchIds]
                .map((batchId) => {
                const seven = sevenByBatch.get(batchId);
                const thirty = thirtyByBatch.get(batchId);
                const source = seven ?? thirty;
                return {
                    batchId,
                    batch: source?.batch ?? "—",
                    course: source?.course ?? "—",
                    percent7: (0, context_1.percent)(num(seven?.present), num(seven?.total)),
                    percent30: (0, context_1.percent)(num(thirty?.present), num(thirty?.total)),
                    present7: num(seven?.present),
                    total7: num(seven?.total),
                    present30: num(thirty?.present),
                    total30: num(thirty?.total),
                };
            })
                .sort((a, b) => a.batch.localeCompare(b.batch)),
            latestPublishedExam: examRow
                ? {
                    examId: examRow.examId,
                    examName: examRow.examName,
                    batch: examRow.batch,
                    term: examRow.term,
                    publishedAt: iso(examRow.publishedAt),
                    total: num(examRow.total),
                    passed: num(examRow.passed),
                    passPercent: (0, context_1.percent)(num(examRow.passed), num(examRow.total)),
                }
                : null,
            latestPublishedResults: latestResultRows.map((row) => ({
                id: row.id,
                examId: row.examId,
                examName: row.examName,
                batch: row.batch,
                term: row.term,
                student: row.student,
                percentage: num(row.percentage),
                gpa: num(row.gpa),
                isPassed: row.isPassed,
                publishedAt: iso(row.publishedAt),
            })),
            latestNotices: latestNotices.map((row) => ({
                id: row.id,
                title: row.title,
                publishedAt: iso(row.publishedAt),
                isPinned: row.isPinned,
            })),
        };
    },
    // ── ACCOUNTANT ──────────────────────────────────────────────────────────
    async accountant() {
        const { today } = todayParts();
        const [kpis, feeAnalytics, collections, journal, payrollAndAlerts] = await Promise.all([
            service_1.AccountantDashboardService.kpis(),
            service_1.AccountantDashboardService.feeAnalytics(),
            service_1.AccountantDashboardService.collections(),
            service_1.AccountantDashboardService.journal(),
            service_1.AccountantDashboardService.payrollAndAlerts(),
        ]);
        const fiscalYear = await prismaClient_1.prismaMain.fiscalYear.findFirst({
            where: { isCurrent: true, deletedAt: null },
            select: { id: true, name: true, startDateBs: true, endDateBs: true },
        });
        const overdueInstallments = async () => {
            if (!today)
                return { count: 0, total: 0 };
            const installments = await prismaClient_1.prismaMain.feeInstallment.findMany({
                where: { deletedAt: null, dueDateBs: { lt: today } },
                select: { id: true, amount: true },
            });
            if (installments.length === 0)
                return { count: 0, total: 0 };
            const paidRows = await prismaClient_1.prismaMain.feePaymentAllocation.groupBy({
                by: ["feeInstallmentId"],
                where: {
                    feeInstallmentId: { in: installments.map((row) => row.id) },
                },
                _sum: { amount: true },
            });
            const paidByInstallment = new Map(paidRows.map((row) => [
                row.feeInstallmentId,
                row._sum.amount ?? (0, money_1.dec)(0),
            ]));
            const outstanding = [];
            for (const installment of installments) {
                const remaining = (0, money_1.dec)(installment.amount).minus(paidByInstallment.get(installment.id) ?? (0, money_1.dec)(0));
                if (remaining.gt(0))
                    outstanding.push(remaining);
            }
            return { count: outstanding.length, total: num((0, money_1.sumMoney)(outstanding)) };
        };
        const paymentMethodSplit = async () => {
            if (!fiscalYear)
                return [];
            const grouped = await prismaClient_1.prismaMain.feePaymentMethodLine.groupBy({
                by: ["paymentMethodId"],
                where: {
                    feePayment: {
                        paymentDateBs: {
                            gte: fiscalYear.startDateBs,
                            lte: fiscalYear.endDateBs,
                        },
                        isCancelled: false,
                    },
                },
                _sum: { amount: true },
            });
            if (grouped.length === 0)
                return [];
            const methods = await prismaClient_1.prismaMain.paymentMethod.findMany({
                where: { id: { in: grouped.map((row) => row.paymentMethodId) } },
                select: { id: true, code: true, name: true },
            });
            const methodById = new Map(methods.map((method) => [method.id, method]));
            return grouped
                .flatMap((row) => {
                const method = methodById.get(row.paymentMethodId);
                if (!method)
                    return [];
                return [
                    {
                        code: method.code,
                        name: method.name,
                        total: num(row._sum.amount ?? 0),
                    },
                ];
            })
                .sort((a, b) => b.total - a.total);
        };
        const fiscalYearTrend = async () => {
            if (!fiscalYear)
                return [];
            const payments = await prismaClient_1.prismaMain.feePayment.findMany({
                where: {
                    paymentDateBs: {
                        gte: fiscalYear.startDateBs,
                        lte: fiscalYear.endDateBs,
                    },
                    isCancelled: false,
                },
                select: { paymentDateBs: true, totalAmount: true },
            });
            const byMonth = new Map();
            for (const payment of payments) {
                const month = payment.paymentDateBs.slice(0, 7);
                byMonth.set(month, (byMonth.get(month) ?? (0, money_1.dec)(0)).plus(payment.totalAmount));
            }
            return [...byMonth.entries()]
                .sort(([left], [right]) => left.localeCompare(right))
                .map(([month, total]) => ({ month, total }));
        };
        const [overdue, methodSplit, fiscalTrend] = await Promise.all([
            overdueInstallments(),
            paymentMethodSplit(),
            fiscalYearTrend(),
        ]);
        return {
            todayBs: today,
            fiscalYear,
            kpis,
            feeAnalytics,
            collections,
            journal,
            payrollAndAlerts,
            overdueInstallments: {
                count: overdue.count,
                total: overdue.total,
            },
            paymentMethodSplit: methodSplit.map((row) => ({
                code: row.code,
                name: row.name,
                total: row.total,
            })),
            fiscalYearTrend: fiscalTrend.map((row) => {
                const [yearBs, monthBs] = row.month.split("-").map(Number);
                return {
                    month: row.month,
                    label: monthLabel(yearBs, monthBs),
                    total: num(row.total),
                };
            }),
        };
    },
    // ── TEACHER ─────────────────────────────────────────────────────────────
    async teacher(actor) {
        const { today } = todayParts();
        const ctx = await (0, context_1.buildContext)(actor.userId, {});
        const [schedule, exams, classAttendance, checkIn, rejected, addedStudents, batchPay, notices] = await Promise.all([
            (0, sections_1.getTodaySchedule)(ctx),
            (0, sections_1.getExamBatches)(ctx),
            (0, sections_1.getClassAttendance)(ctx),
            this.checkIn(actor.userId),
            workflow_1.ExamSubjectWorkflow.groups({ status: "REJECTED", page: 1, limit: 20 }, actor),
            prismaClient_1.prismaMain.student.findMany({
                where: {
                    deletedAt: null,
                    createdBy: actor.userId ?? null,
                    approvalStatus: "PENDING",
                },
                select: {
                    id: true,
                    firstName: true,
                    middleName: true,
                    lastName: true,
                    universityRegNo: true,
                    createdAt: true,
                    batch: { select: { name: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            }),
            this.teacherBatchPay(ctx.teacherId, today),
            prismaClient_1.prismaMain.notice.findMany({
                where: {
                    isPublished: true,
                    deletedAt: null,
                    ...(await (0, audience_1.buildAudienceClause)(actor)),
                },
                select: { id: true, title: true, publishedAt: true, isPinned: true },
                orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
                take: 6,
            }),
        ]);
        const marksNeedingEntry = exams.upcomingExamBatches.filter((item) => item.marksStatus !== "COMPLETE");
        const submittedStatuses = await prismaClient_1.prismaMain.examSubject.groupBy({
            by: ["status"],
            where: {
                deletedAt: null,
                batchTermSubject: {
                    assignments: {
                        some: { teacherId: ctx.teacherId, deletedAt: null },
                    },
                },
            },
            _count: { _all: true },
        });
        const statusCount = (code) => num(submittedStatuses.find((row) => row.status === code)?._count._all);
        return {
            todayBs: today,
            teacher: {
                totalClasses: ctx.assignmentMeta.length,
                totalStudents: ctx.totalStudents,
            },
            checkIn,
            todayClasses: schedule.todaySchedule,
            pendingAttendance: schedule.pendingAttendance,
            marksNeedingEntry,
            rejectedSubjects: rejected.data,
            submissionStatus: {
                draft: statusCount("DRAFT"),
                pending: statusCount("PENDING"),
                approved: statusCount("APPROVED"),
                rejected: statusCount("REJECTED"),
            },
            classAttendance,
            addedStudentsPending: addedStudents.map((row) => ({
                id: row.id,
                name: fullName(row),
                universityRegNo: row.universityRegNo,
                batch: row.batch.name,
                createdAt: iso(row.createdAt),
            })),
            batchPay,
            notices: notices.map((row) => ({
                id: row.id,
                title: row.title,
                publishedAt: iso(row.publishedAt),
                isPinned: row.isPinned,
            })),
        };
    },
    /** Employee check-in for today (geofencing is not modelled in this repo). */
    async checkIn(userId) {
        const { today } = todayParts();
        if (!userId || !today) {
            return {
                available: false,
                status: EMPTY_STATUS,
                checkInTime: null,
                distanceKm: null,
                note: "Check-in is not available for this account.",
            };
        }
        const employee = await prismaClient_1.prismaMain.employee.findFirst({
            where: { userId, deletedAt: null },
            select: { id: true },
        });
        if (!employee) {
            return {
                available: false,
                status: EMPTY_STATUS,
                checkInTime: null,
                distanceKm: null,
                note: "No employee profile is linked to this account.",
            };
        }
        const row = await prismaClient_1.prismaMain.employeeAttendance.findFirst({
            where: { employeeId: employee.id, dateBs: today, deletedAt: null },
            select: {
                status: true,
                remarks: true,
                createdAt: true,
                leaveType: { select: { name: true } },
            },
        });
        return {
            available: true,
            status: row?.status ?? EMPTY_STATUS,
            checkInTime: row ? iso(row.createdAt) : null,
            distanceKm: null,
            leaveType: row?.leaveType?.name ?? null,
            remarks: row?.remarks ?? null,
            note: row
                ? "Attendance is recorded by the principal; distance/geofence data is not stored."
                : "No attendance has been recorded for today yet.",
            nowMinutes: (0, context_1.currentMinutesInKathmandu)(),
        };
    },
    async teacherBatchPay(teacherId, today) {
        if (!today)
            return { expectedMonthly: 0, items: [] };
        const rows = await prismaClient_1.prismaMain.teacherBatchPay.findMany({
            where: {
                deletedAt: null,
                effectiveFromBs: { lte: today },
                OR: [{ effectiveToBs: null }, { effectiveToBs: { gte: today } }],
                teachingAssignment: { teacherId, deletedAt: null },
            },
            select: {
                id: true,
                ratePerCreditHour: true,
                fixedMonthlyAmount: true,
                teachingAssignment: {
                    select: {
                        batchTermSubject: {
                            select: {
                                creditHour: true,
                                subject: { select: { name: true } },
                                batchTerm: {
                                    select: {
                                        name: true,
                                        termNumber: true,
                                        batch: { select: { name: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        const items = rows
            .map((row) => {
            const subject = row.teachingAssignment.batchTermSubject;
            const fixed = num(row.fixedMonthlyAmount);
            const hourly = num(row.ratePerCreditHour) * num(subject.creditHour);
            const amount = fixed > 0 ? fixed : hourly;
            return {
                id: row.id,
                subject: subject.subject.name,
                batch: subject.batchTerm.batch.name,
                term: subject.batchTerm.name,
                termNumber: subject.batchTerm.termNumber,
                creditHour: num(subject.creditHour),
                amount: Math.round(amount * 100) / 100,
            };
        })
            .sort((a, b) => a.batch.localeCompare(b.batch) ||
            a.termNumber - b.termNumber ||
            a.subject.localeCompare(b.subject))
            .map(({ termNumber: _termNumber, ...item }) => item);
        return {
            expectedMonthly: Math.round(items.reduce((sum, item) => sum + item.amount, 0) * 100) / 100,
            items,
        };
    },
    // ── STAFF ───────────────────────────────────────────────────────────────
    async staff(actor) {
        const { today } = todayParts();
        const checkIn = await this.checkIn(actor.userId);
        const employee = await prismaClient_1.prismaMain.employee.findFirst({
            where: { userId: actor.userId ?? "", deletedAt: null },
            select: {
                id: true,
                employeeCode: true,
                firstName: true,
                middleName: true,
                lastName: true,
                designation: true,
                email: true,
                phone: true,
                photoUrl: true,
                joinDateBs: true,
                staff: { select: { department: true } },
            },
        });
        if (!employee) {
            return {
                todayBs: today,
                checkIn,
                monthAttendance: { present: 0, absent: 0, leave: 0, halfDay: 0, total: 0 },
                leaveBalances: [],
                leaveRecords: [],
                latestPayslip: null,
                notices: [],
                profile: null,
            };
        }
        const todayDate = today ?? "2000-01-01";
        const monthRange = (0, bs_date_1.bsMonthRange)(Number(todayDate.slice(0, 4)), Number(todayDate.slice(5, 7)));
        const [statusRows, leaveTypes, attendanceRecords, latestPayslip, notices] = await Promise.all([
            prismaClient_1.prismaMain.employeeAttendance.groupBy({
                by: ["status"],
                where: {
                    employeeId: employee.id,
                    deletedAt: null,
                    dateBs: { gte: monthRange.startBs, lte: monthRange.endBs },
                },
                _count: { _all: true },
            }),
            prismaClient_1.prismaMain.leaveType.findMany({
                where: { deletedAt: null, isActive: true },
                select: {
                    id: true,
                    code: true,
                    name: true,
                    yearlyAllowed: true,
                    employeeAttendances: {
                        where: {
                            employeeId: employee.id,
                            deletedAt: null,
                            dateBs: { gte: monthRange.startBs, lte: monthRange.endBs },
                            status: "LEAVE",
                        },
                        select: { id: true },
                    },
                },
                orderBy: { name: "asc" },
            }),
            prismaClient_1.prismaMain.employeeAttendance.findMany({
                where: {
                    employeeId: employee.id,
                    deletedAt: null,
                    dateBs: { gte: monthRange.startBs, lte: monthRange.endBs },
                },
                select: {
                    id: true,
                    dateBs: true,
                    status: true,
                    remarks: true,
                    leaveType: { select: { name: true } },
                },
                orderBy: { dateBs: "desc" },
                take: 20,
            }),
            prismaClient_1.prismaMain.payslip.findFirst({
                where: { employeeId: employee.id },
                select: {
                    id: true,
                    payslipNo: true,
                    grossPay: true,
                    netPay: true,
                    paidDateBs: true,
                    createdAt: true,
                    payroll: {
                        select: { yearBs: true, monthBs: true },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.notice.findMany({
                where: {
                    isPublished: true,
                    deletedAt: null,
                    ...(await (0, audience_1.buildAudienceClause)(actor)),
                },
                select: { id: true, title: true, publishedAt: true, isPinned: true },
                orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
                take: 6,
            }),
        ]);
        const byStatus = new Map(statusRows.map((row) => [row.status, row._count._all]));
        const month = {
            present: byStatus.get("PRESENT") ?? 0,
            absent: byStatus.get("ABSENT") ?? 0,
            leave: byStatus.get("LEAVE") ?? 0,
            halfDay: 0,
            total: statusRows.reduce((sum, row) => sum + row._count._all, 0),
        };
        const leaveBalances = leaveTypes.map((leaveType) => ({
            id: leaveType.id,
            code: leaveType.code,
            name: leaveType.name,
            allowed: leaveType.yearlyAllowed,
            used: leaveType.employeeAttendances.length,
        }));
        const leaveRecords = attendanceRecords.map((row) => ({
            id: row.id,
            dateBs: row.dateBs,
            status: row.status,
            leaveType: row.leaveType?.name ?? null,
            remarks: row.remarks,
        }));
        return {
            todayBs: today,
            checkIn,
            monthAttendance: {
                present: num(month.present),
                absent: num(month.absent),
                leave: num(month.leave),
                halfDay: num(month.halfDay),
                total: num(month.total),
            },
            monthLabel: monthLabel(monthRange.startBs ? Number(monthRange.startBs.slice(0, 4)) : 0, monthRange.startBs ? Number(monthRange.startBs.slice(5, 7)) : 0),
            leaveBalances: leaveBalances.map((row) => ({
                id: row.id,
                code: row.code,
                name: row.name,
                allowed: row.allowed == null ? null : num(row.allowed),
                used: num(row.used),
                remaining: row.allowed == null ? null : Math.max(0, num(row.allowed) - num(row.used)),
            })),
            leaveRecords: leaveRecords.map((row) => ({
                id: row.id,
                dateBs: row.dateBs,
                status: row.status,
                leaveType: row.leaveType,
                remarks: row.remarks,
            })),
            latestPayslip: latestPayslip
                ? {
                    id: latestPayslip.id,
                    payslipNo: latestPayslip.payslipNo,
                    grossPay: num(latestPayslip.grossPay),
                    netPay: num(latestPayslip.netPay),
                    paidDateBs: latestPayslip.paidDateBs,
                    createdAt: iso(latestPayslip.createdAt),
                    yearBs: latestPayslip.payroll?.yearBs ?? null,
                    monthBs: latestPayslip.payroll?.monthBs ?? null,
                }
                : null,
            notices: notices.map((row) => ({
                id: row.id,
                title: row.title,
                publishedAt: iso(row.publishedAt),
                isPinned: row.isPinned,
            })),
            profile: {
                id: employee.id,
                employeeCode: employee.employeeCode,
                name: fullName(employee),
                designation: employee.designation,
                department: employee.staff?.department ?? null,
                email: employee.email,
                phone: employee.phone,
                photoUrl: employee.photoUrl,
                joinDateBs: employee.joinDateBs,
            },
        };
    },
};
