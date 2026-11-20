"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeStudentDues = computeStudentDues;
// Student dues / defaulter computation (feature 8).
// Paid = allocations against non-cancelled payments only. All math is Decimal.
const client_js_1 = require("../generated/prisma/client.js");
const CustomError_1 = require("@/errors/CustomError");
const money_1 = require("./money");
const bs_date_1 = require("@/utils/bs-date");
/**
 * Remaining due per student fee item, with paid amounts taken from
 * allocations on non-cancelled payments. Skipped items owe nothing.
 */
async function computeStudentDues(tx, studentId) {
    const student = await tx.student.findFirst({
        where: { id: studentId, deletedAt: null },
        select: { id: true, universityRegNo: true },
    });
    if (!student)
        throw new CustomError_1.CustomError("Student not found", 404);
    const fees = await tx.studentFee.findMany({
        where: { studentId, deletedAt: null },
        include: {
            items: {
                where: { deletedAt: null },
                include: {
                    feeHead: { select: { code: true } },
                    installments: { where: { deletedAt: null } },
                },
            },
        },
    });
    // Paid per (studentFeeItemId) and per (installment) across live payments.
    const allocations = await tx.feePaymentAllocation.findMany({
        where: {
            feePayment: { studentId, isCancelled: false },
            studentFeeItem: {
                studentFee: { studentId, deletedAt: null },
                deletedAt: null,
            },
        },
        select: {
            amount: true,
            studentFeeItemId: true,
            feeInstallmentId: true,
        },
    });
    const paidByItem = new Map();
    const paidByInstallment = new Map();
    for (const allocation of allocations) {
        paidByItem.set(allocation.studentFeeItemId, (paidByItem.get(allocation.studentFeeItemId) ?? new client_js_1.Prisma.Decimal(0)).plus(allocation.amount));
        if (allocation.feeInstallmentId) {
            paidByInstallment.set(allocation.feeInstallmentId, (paidByInstallment.get(allocation.feeInstallmentId) ??
                new client_js_1.Prisma.Decimal(0)).plus(allocation.amount));
        }
    }
    const today = (0, bs_date_1.todayBs)();
    const items = [];
    const installments = [];
    let totalNet = new client_js_1.Prisma.Decimal(0);
    let totalPaid = new client_js_1.Prisma.Decimal(0);
    let totalDue = new client_js_1.Prisma.Decimal(0);
    let hasOverdueDue = false;
    for (const fee of fees) {
        for (const item of fee.items) {
            const paid = paidByItem.get(item.id) ?? new client_js_1.Prisma.Decimal(0);
            const remaining = item.isSkipped
                ? new client_js_1.Prisma.Decimal(0)
                : (0, money_1.round2)(item.netAmount.minus(paid));
            const overdueEffectiveDate = item.dueDateBs;
            const isOverdue = !item.isSkipped &&
                remaining.isPositive() &&
                today !== null &&
                overdueEffectiveDate !== null &&
                overdueEffectiveDate <= today;
            if (isOverdue)
                hasOverdueDue = true;
            if (!item.isSkipped) {
                totalNet = totalNet.plus(item.netAmount);
                totalPaid = totalPaid.plus(paid);
                totalDue = totalDue.plus(remaining);
            }
            items.push({
                studentFeeItemId: item.id,
                feeHead: item.feeHead.code,
                amount: (0, money_1.moneyStr)(item.amount),
                discountAmount: (0, money_1.moneyStr)(item.discountAmount),
                netAmount: (0, money_1.moneyStr)(item.netAmount),
                paidAmount: (0, money_1.moneyStr)(paid),
                remainingDue: (0, money_1.moneyStr)(remaining),
                dueDateBs: item.dueDateBs,
                isSkipped: item.isSkipped,
                isOverdue,
            });
            for (const installment of item.installments) {
                const installmentPaid = paidByInstallment.get(installment.id) ?? new client_js_1.Prisma.Decimal(0);
                const installmentRemaining = (0, money_1.round2)(installment.amount.minus(installmentPaid));
                const installmentOverdue = installmentRemaining.isPositive() &&
                    today !== null &&
                    installment.dueDateBs <= today;
                if (installmentOverdue)
                    hasOverdueDue = true;
                installments.push({
                    installmentId: installment.id,
                    studentFeeItemId: item.id,
                    installmentNo: installment.installmentNo,
                    dueDateBs: installment.dueDateBs,
                    amount: (0, money_1.moneyStr)(installment.amount),
                    paidAmount: (0, money_1.moneyStr)(installmentPaid),
                    remainingDue: (0, money_1.moneyStr)(installmentRemaining),
                    isOverdue: installmentOverdue,
                });
            }
        }
    }
    return {
        studentId: student.id,
        universityRegNo: student.universityRegNo,
        totalNet: (0, money_1.moneyStr)(totalNet),
        totalPaid: (0, money_1.moneyStr)(totalPaid),
        totalDue: (0, money_1.moneyStr)(totalDue),
        // Defaulter = owes money with a passed due date (item or installment).
        isDefaulter: totalDue.isPositive() && hasOverdueDue,
        items,
        installments,
    };
}
