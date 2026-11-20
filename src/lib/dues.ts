// Student dues / defaulter computation (feature 8).
// Paid = allocations against non-cancelled payments only. All math is Decimal.
import { Prisma } from "../generated/prisma/client.js";
import { CustomError } from "@/errors/CustomError";
import { moneyStr, round2 } from "./money";
import type { TxClient } from "./accounting";
import { todayBs } from "@/utils/bs-date";

export interface StudentDuesItem {
  studentFeeItemId: string;
  feeHead: string;
  amount: string;
  discountAmount: string;
  netAmount: string;
  paidAmount: string;
  remainingDue: string;
  dueDateBs: string | null;
  isSkipped: boolean;
  isOverdue: boolean;
}

export interface StudentDuesResult {
  studentId: string;
  universityRegNo: string;
  totalNet: string;
  totalPaid: string;
  totalDue: string;
  isDefaulter: boolean;
  items: StudentDuesItem[];
  installments: Array<{
    installmentId: string;
    studentFeeItemId: string;
    installmentNo: number;
    dueDateBs: string;
    amount: string;
    paidAmount: string;
    remainingDue: string;
    isOverdue: boolean;
  }>;
}

/**
 * Remaining due per student fee item, with paid amounts taken from
 * allocations on non-cancelled payments. Skipped items owe nothing.
 */
export async function computeStudentDues(
  tx: TxClient,
  studentId: string,
): Promise<StudentDuesResult> {
  const student = await tx.student.findFirst({
    where: { id: studentId, deletedAt: null },
    select: { id: true, universityRegNo: true },
  });
  if (!student) throw new CustomError("Student not found", 404);

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

  const paidByItem = new Map<string, Prisma.Decimal>();
  const paidByInstallment = new Map<string, Prisma.Decimal>();
  for (const allocation of allocations) {
    paidByItem.set(
      allocation.studentFeeItemId,
      (paidByItem.get(allocation.studentFeeItemId) ?? new Prisma.Decimal(0)).plus(
        allocation.amount,
      ),
    );
    if (allocation.feeInstallmentId) {
      paidByInstallment.set(
        allocation.feeInstallmentId,
        (paidByInstallment.get(allocation.feeInstallmentId) ??
          new Prisma.Decimal(0)).plus(allocation.amount),
      );
    }
  }

  const today = todayBs();
  const items: StudentDuesItem[] = [];
  const installments: StudentDuesResult["installments"] = [];
  let totalNet = new Prisma.Decimal(0);
  let totalPaid = new Prisma.Decimal(0);
  let totalDue = new Prisma.Decimal(0);
  let hasOverdueDue = false;

  for (const fee of fees) {
    for (const item of fee.items) {
      const paid = paidByItem.get(item.id) ?? new Prisma.Decimal(0);
      const remaining = item.isSkipped
        ? new Prisma.Decimal(0)
        : round2(item.netAmount.minus(paid));
      const overdueEffectiveDate = item.dueDateBs;
      const isOverdue =
        !item.isSkipped &&
        remaining.isPositive() &&
        today !== null &&
        overdueEffectiveDate !== null &&
        overdueEffectiveDate <= today;
      if (isOverdue) hasOverdueDue = true;

      if (!item.isSkipped) {
        totalNet = totalNet.plus(item.netAmount);
        totalPaid = totalPaid.plus(paid);
        totalDue = totalDue.plus(remaining);
      }

      items.push({
        studentFeeItemId: item.id,
        feeHead: item.feeHead.code,
        amount: moneyStr(item.amount),
        discountAmount: moneyStr(item.discountAmount),
        netAmount: moneyStr(item.netAmount),
        paidAmount: moneyStr(paid),
        remainingDue: moneyStr(remaining),
        dueDateBs: item.dueDateBs,
        isSkipped: item.isSkipped,
        isOverdue,
      });

      for (const installment of item.installments) {
        const installmentPaid =
          paidByInstallment.get(installment.id) ?? new Prisma.Decimal(0);
        const installmentRemaining = round2(
          installment.amount.minus(installmentPaid),
        );
        const installmentOverdue =
          installmentRemaining.isPositive() &&
          today !== null &&
          installment.dueDateBs <= today;
        if (installmentOverdue) hasOverdueDue = true;

        installments.push({
          installmentId: installment.id,
          studentFeeItemId: item.id,
          installmentNo: installment.installmentNo,
          dueDateBs: installment.dueDateBs,
          amount: moneyStr(installment.amount),
          paidAmount: moneyStr(installmentPaid),
          remainingDue: moneyStr(installmentRemaining),
          isOverdue: installmentOverdue,
        });
      }
    }
  }

  return {
    studentId: student.id,
    universityRegNo: student.universityRegNo,
    totalNet: moneyStr(totalNet),
    totalPaid: moneyStr(totalPaid),
    totalDue: moneyStr(totalDue),
    // Defaulter = owes money with a passed due date (item or installment).
    isDefaulter: totalDue.isPositive() && hasOverdueDue,
    items,
    installments,
  };
}
