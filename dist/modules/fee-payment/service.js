"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeePaymentService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const safe_select_1 = require("@/utils/safe-select");
const client_js_1 = require("../../generated/prisma/client.js");
const CustomError_1 = require("@/errors/CustomError");
const money_1 = require("@/lib/money");
const accounting_1 = require("@/lib/accounting");
const bs_date_1 = require("@/utils/bs-date");
/** Chart-of-accounts code credited when fee money arrives. */
const FEE_INCOME_ACCOUNT_CODE = "FEE-INCOME";
const PAYMENT_INCLUDE = {
    student: { select: safe_select_1.STUDENT_SAFE_SELECT },
    fiscalYear: true,
    journalEntry: {
        include: {
            lines: { include: { account: { select: safe_select_1.ACCOUNT_SAFE_SELECT } } },
        },
    },
    allocations: {
        include: {
            studentFeeItem: { include: { feeHead: true } },
            feeInstallment: true,
        },
    },
    methodLines: { include: { paymentMethod: true } },
};
exports.FeePaymentService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {};
        if (query.studentId) {
            whereClause.studentId = query.studentId;
        }
        if (query.fiscalYearId) {
            whereClause.fiscalYearId = query.fiscalYearId;
        }
        if (query.search) {
            whereClause.OR = [
                { receiptNo: { contains: query.search, mode: "insensitive" } },
                {
                    student: {
                        universityRegNo: { contains: query.search, mode: "insensitive" },
                    },
                },
                { remarks: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [payments, total] = await Promise.all([
            prismaClient_1.prismaMain.feePayment.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    student: {
                        select: {
                            id: true,
                            universityRegNo: true,
                            firstName: true,
                            middleName: true,
                            lastName: true,
                            batchId: true,
                        },
                    },
                    fiscalYear: true,
                    allocations: true,
                    methodLines: { include: { paymentMethod: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.feePayment.count({ where: whereClause }),
        ]);
        return {
            data: payments,
            pagination: { page, limit, total },
        };
    },
    async create(data, userId) {
        return (0, accounting_1.withSequentialRetry)(() => prismaClient_1.prismaMain.$transaction(async (tx) => this.createInTransaction(tx, data, userId)));
    },
    /**
     * Records a fee payment end-to-end in one transaction:
     *  receipt (RC-<FY>-<seq>) + method lines + allocations, plus an
     *  auto-posted FEE_PAYMENT journal entry (Dr payment-method accounts /
     *  Cr FEE-INCOME). Sums must match: methodLines == total == allocations,
     *  and every allocation must fit within the item's remaining due.
     */
    async createInTransaction(tx, data, userId) {
        const total = (0, money_1.dec)(data.totalAmount, "totalAmount");
        if (!total.isPositive()) {
            throw new CustomError_1.CustomError("Total amount must be positive", 400);
        }
        const student = await tx.student.findFirst({
            where: { id: data.studentId, deletedAt: null },
        });
        if (!student) {
            throw new CustomError_1.CustomError("Student not found", 404);
        }
        const fiscalYear = data.fiscalYearId
            ? await tx.fiscalYear.findFirst({
                where: { id: data.fiscalYearId, deletedAt: null },
            })
            : await tx.fiscalYear.findFirst({
                where: { isCurrent: true, deletedAt: null },
            });
        if (!fiscalYear) {
            throw new CustomError_1.CustomError(data.fiscalYearId
                ? "Fiscal year not found"
                : "No current fiscal year set", 404);
        }
        (0, accounting_1.assertFiscalYearOpen)(fiscalYear);
        if (!(0, bs_date_1.isBsDateWithinRange)(data.paymentDateBs, fiscalYear.startDateBs, fiscalYear.endDateBs)) {
            throw new CustomError_1.CustomError(`Payment date ${data.paymentDateBs} is outside fiscal year ${fiscalYear.name} (${fiscalYear.startDateBs} to ${fiscalYear.endDateBs})`, 400);
        }
        // ---- method lines: must equal the total, methods must be journal-ready
        const methodLineAmounts = data.methodLines.map((row) => (0, money_1.dec)(row.amount, "method line amount"));
        const methodLinesTotal = (0, money_1.sumMoney)(methodLineAmounts);
        if (!(0, money_1.moneyEq)(methodLinesTotal, total)) {
            throw new CustomError_1.CustomError(`Method lines sum (${(0, money_1.moneyStr)(methodLinesTotal)}) must equal the total amount (${(0, money_1.moneyStr)(total)})`, 400);
        }
        const paymentMethods = await tx.paymentMethod.findMany({
            where: {
                id: {
                    in: [...new Set(data.methodLines.map((row) => row.paymentMethodId))],
                },
                deletedAt: null,
            },
        });
        const methodById = new Map(paymentMethods.map((row) => [row.id, row]));
        for (const row of data.methodLines) {
            const method = methodById.get(row.paymentMethodId);
            if (!method) {
                throw new CustomError_1.CustomError("Payment method not found", 404);
            }
            if (!method.isActive) {
                throw new CustomError_1.CustomError(`Payment method ${method.code} is inactive`, 400);
            }
            if (!method.accountId) {
                throw new CustomError_1.CustomError(`Payment method ${method.code} has no ledger account mapped; map one to its account before recording payments`, 400);
            }
        }
        // ---- allocations: must equal the total and fit the remaining dues
        const allocationAmounts = data.allocations.map((row) => (0, money_1.dec)(row.amount, "allocation amount"));
        const allocationsTotal = (0, money_1.sumMoney)(allocationAmounts);
        if (!(0, money_1.moneyEq)(allocationsTotal, total)) {
            throw new CustomError_1.CustomError(`Allocations sum (${(0, money_1.moneyStr)(allocationsTotal)}) must equal the total amount (${(0, money_1.moneyStr)(total)})`, 400);
        }
        const itemIds = [
            ...new Set(data.allocations.map((row) => row.studentFeeItemId)),
        ];
        const items = await tx.studentFeeItem.findMany({
            where: { id: { in: itemIds }, deletedAt: null },
            include: {
                studentFee: { select: { studentId: true } },
                feeHead: { select: { code: true } },
            },
        });
        const itemById = new Map(items.map((row) => [row.id, row]));
        for (const itemId of itemIds) {
            const item = itemById.get(itemId);
            if (!item) {
                throw new CustomError_1.CustomError(`Student fee item ${itemId} not found`, 404);
            }
            if (item.studentFee.studentId !== data.studentId) {
                throw new CustomError_1.CustomError("One or more allocations belong to a different student", 400);
            }
            if (item.isSkipped) {
                throw new CustomError_1.CustomError(`Fee item ${item.feeHead.code} is skipped and cannot take payments`, 400);
            }
        }
        const installmentIds = [
            ...new Set(data.allocations
                .map((row) => row.feeInstallmentId)
                .filter((id) => Boolean(id))),
        ];
        const installments = installmentIds.length > 0
            ? await tx.feeInstallment.findMany({
                where: { id: { in: installmentIds }, deletedAt: null },
            })
            : [];
        const installmentById = new Map(installments.map((row) => [row.id, row]));
        for (const row of data.allocations) {
            if (!row.feeInstallmentId)
                continue;
            const installment = installmentById.get(row.feeInstallmentId);
            if (!installment) {
                throw new CustomError_1.CustomError("Fee installment not found", 404);
            }
            if (installment.studentFeeItemId !== row.studentFeeItemId) {
                throw new CustomError_1.CustomError("Fee installment does not belong to the allocated fee item", 400);
            }
        }
        // Already-paid amounts across live (non-cancelled) payments.
        const priorAllocations = await tx.feePaymentAllocation.findMany({
            where: {
                feePayment: { studentId: data.studentId, isCancelled: false },
                studentFeeItemId: { in: itemIds },
            },
            select: {
                studentFeeItemId: true,
                feeInstallmentId: true,
                amount: true,
            },
        });
        const paidByItem = new Map();
        const paidByInstallment = new Map();
        for (const row of priorAllocations) {
            paidByItem.set(row.studentFeeItemId, (paidByItem.get(row.studentFeeItemId) ?? new client_js_1.Prisma.Decimal(0)).plus(row.amount));
            if (row.feeInstallmentId) {
                paidByInstallment.set(row.feeInstallmentId, (paidByInstallment.get(row.feeInstallmentId) ?? new client_js_1.Prisma.Decimal(0)).plus(row.amount));
            }
        }
        const requestedByItem = new Map();
        const requestedByInstallment = new Map();
        data.allocations.forEach((row, index) => {
            const amount = allocationAmounts[index];
            requestedByItem.set(row.studentFeeItemId, (requestedByItem.get(row.studentFeeItemId) ?? new client_js_1.Prisma.Decimal(0)).plus(amount));
            if (row.feeInstallmentId) {
                requestedByInstallment.set(row.feeInstallmentId, (requestedByInstallment.get(row.feeInstallmentId) ??
                    new client_js_1.Prisma.Decimal(0)).plus(amount));
            }
        });
        for (const [itemId, requested] of requestedByItem) {
            const item = itemById.get(itemId);
            if (!item)
                continue;
            const remaining = (0, money_1.round2)(item.netAmount.minus(paidByItem.get(itemId) ?? new client_js_1.Prisma.Decimal(0)));
            if (requested.gt(remaining)) {
                throw new CustomError_1.CustomError(`Allocation for ${item.feeHead.code} exceeds its remaining due (${(0, money_1.moneyStr)(remaining)})`, 400);
            }
        }
        for (const [installmentId, requested] of requestedByInstallment) {
            const installment = installmentById.get(installmentId);
            if (!installment)
                continue;
            const remaining = (0, money_1.round2)(installment.amount.minus(paidByInstallment.get(installmentId) ?? new client_js_1.Prisma.Decimal(0)));
            if (requested.gt(remaining)) {
                throw new CustomError_1.CustomError(`Allocation exceeds installment ${installment.installmentNo}'s remaining amount (${(0, money_1.moneyStr)(remaining)})`, 400);
            }
        }
        // ---- journal lines: Dr each method account / Cr FEE-INCOME per allocation
        const feeIncomeAccount = await tx.account.findFirst({
            where: { code: FEE_INCOME_ACCOUNT_CODE, deletedAt: null },
        });
        if (!feeIncomeAccount) {
            throw new CustomError_1.CustomError(`Fee income account (${FEE_INCOME_ACCOUNT_CODE}) not found; call POST /api/account/seed-default to create the default chart of accounts`, 400);
        }
        const debitByAccount = new Map();
        data.methodLines.forEach((row, index) => {
            const method = methodById.get(row.paymentMethodId);
            if (!method?.accountId)
                return;
            debitByAccount.set(method.accountId, (debitByAccount.get(method.accountId) ?? new client_js_1.Prisma.Decimal(0)).plus(methodLineAmounts[index]));
        });
        const journalLines = [
            ...[...debitByAccount.entries()].map(([accountId, debit]) => ({
                accountId,
                debit,
                description: "Fee payment received",
            })),
            ...data.allocations.map((row, index) => ({
                accountId: feeIncomeAccount.id,
                credit: allocationAmounts[index],
                studentId: data.studentId,
                description: `Fee income: ${itemById.get(row.studentFeeItemId)?.feeHead.code ?? ""}`,
            })),
        ];
        // ---- persist: payment + lines + allocations + journal, one transaction
        const receiptNo = await (0, accounting_1.nextSequenceNo)(tx, {
            model: "feePayment",
            field: "receiptNo",
            prefix: `RC-${fiscalYear.name}-`,
        });
        const payment = await tx.feePayment.create({
            data: {
                receiptNo,
                studentId: data.studentId,
                fiscalYearId: fiscalYear.id,
                paymentDateBs: data.paymentDateBs,
                totalAmount: total,
                remarks: data.remarks ?? null,
                createdBy: userId,
                methodLines: {
                    create: data.methodLines.map((row, index) => ({
                        paymentMethodId: row.paymentMethodId,
                        amount: methodLineAmounts[index],
                        referenceNo: row.referenceNo ?? null,
                        bankName: row.bankName ?? null,
                        createdBy: userId,
                    })),
                },
                allocations: {
                    create: data.allocations.map((row, index) => ({
                        studentFeeItemId: row.studentFeeItemId,
                        feeInstallmentId: row.feeInstallmentId ?? null,
                        amount: allocationAmounts[index],
                        createdBy: userId,
                    })),
                },
            },
        });
        const journalEntry = await (0, accounting_1.createJournalEntry)(tx, {
            fiscalYearId: fiscalYear.id,
            dateBs: data.paymentDateBs,
            description: `Fee payment ${receiptNo} for student ${student.universityRegNo}`,
            source: "FEE_PAYMENT",
            sourceRefId: payment.id,
            isManual: false,
            lines: journalLines,
            createdBy: userId,
        });
        await tx.feePayment.update({
            where: { id: payment.id },
            data: { journalEntryId: journalEntry.id, updatedBy: userId },
        });
        const created = await tx.feePayment.findUnique({
            where: { id: payment.id },
            include: PAYMENT_INCLUDE,
        });
        if (!created) {
            throw new CustomError_1.CustomError("Fee payment could not be created", 500);
        }
        return created;
    },
    async getById(id) {
        const payment = await prismaClient_1.prismaMain.feePayment.findUnique({
            where: { id },
            include: {
                student: { include: { batch: { include: { course: true } } } },
                fiscalYear: true,
                journalEntry: { include: { lines: { include: { account: true } } } },
                allocations: {
                    include: {
                        studentFeeItem: {
                            include: { feeHead: true, feeStructureItem: true },
                        },
                        feeInstallment: true,
                    },
                },
                methodLines: { include: { paymentMethod: true } },
            },
        });
        if (!payment) {
            throw new CustomError_1.CustomError("Fee payment not found", 404);
        }
        return payment;
    },
    /**
     * Cancels by reversal only: the payment stays in the ledger, its journal
     * entry is reversed with a FEE_PAYMENT_CANCEL entry (same transaction),
     * and the payment is flagged cancelled. Payments are never deleted.
     */
    async cancel(id, userId, reason) {
        return (0, accounting_1.withSequentialRetry)(() => prismaClient_1.prismaMain.$transaction(async (tx) => {
            const existing = await tx.feePayment.findUnique({
                where: { id },
                include: PAYMENT_INCLUDE,
            });
            if (!existing) {
                throw new CustomError_1.CustomError("Fee payment not found", 404);
            }
            if (existing.isCancelled) {
                throw new CustomError_1.CustomError("Fee payment is already cancelled", 400);
            }
            if (existing.journalEntryId) {
                await (0, accounting_1.reverseJournalEntry)(tx, existing.journalEntryId, {
                    source: "FEE_PAYMENT_CANCEL",
                    sourceRefId: existing.id,
                    description: `Reversal of fee payment ${existing.receiptNo} — ${reason}`,
                    createdBy: userId,
                });
            }
            const updated = await tx.feePayment.update({
                where: { id },
                data: {
                    isCancelled: true,
                    cancelledAt: new Date(),
                    cancelReason: reason,
                    updatedBy: userId,
                },
                include: PAYMENT_INCLUDE,
            });
            return updated;
        }));
    },
    /** Fee payments are append-only; deletion is never allowed. */
    async delete(_id, _userId) {
        throw new CustomError_1.CustomError("Fee payments are append-only and cannot be deleted; use POST /fee-payment/:id/cancel to reverse them", 409);
    },
};
