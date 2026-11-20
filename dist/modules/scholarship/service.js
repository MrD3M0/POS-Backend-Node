"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScholarshipService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
const money_1 = require("@/lib/money");
const crypto_1 = require("crypto");
const PERCENT = "PERCENT";
const FIXED = "FIXED";
/** Only these columns are read from `students` (the dev DB drifts on the enum columns). */
const STUDENT_SELECT = {
    id: true,
    universityRegNo: true,
    firstName: true,
    middleName: true,
    lastName: true,
    batchId: true,
};
function fullName(student) {
    return [student.firstName, student.middleName, student.lastName]
        .filter(Boolean)
        .join(" ");
}
exports.ScholarshipService = {
    // ── Schemes ────────────────────────────────────────────────────────────
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = { deletedAt: null };
        if (query.search) {
            whereClause.OR = [
                { name: { contains: query.search, mode: "insensitive" } },
                { code: { contains: query.search, mode: "insensitive" } },
                { description: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [scholarships, total] = await Promise.all([
            prismaClient_1.prismaMain.scholarship.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: { _count: { select: { grants: true } } },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.scholarship.count({ where: whereClause }),
        ]);
        return { data: scholarships, pagination: { page, limit, total } };
    },
    async create(data, userId) {
        if (data.type === PERCENT && Number(data.value) > 100) {
            throw new CustomError_1.CustomError("A percentage scholarship cannot be above 100", 400);
        }
        try {
            return await prismaClient_1.prismaMain.scholarship.create({
                data: {
                    name: data.name.trim(),
                    code: data.code?.trim() || null,
                    type: data.type,
                    value: (0, money_1.dec)(data.value, "value"),
                    description: data.description?.trim() || null,
                    isActive: data.isActive ?? true,
                    createdBy: userId ?? null,
                    updatedBy: userId ?? null,
                },
            });
        }
        catch (error) {
            if (error?.code === "P2002") {
                throw new CustomError_1.CustomError("A scholarship with this code already exists", 409);
            }
            throw error;
        }
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.scholarship.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Scholarship not found", 404);
        const type = data.type ?? existing.type;
        const value = data.value !== undefined ? (0, money_1.dec)(data.value, "value") : existing.value;
        if (type === PERCENT && Number(value) > 100) {
            throw new CustomError_1.CustomError("A percentage scholarship cannot be above 100", 400);
        }
        try {
            return await prismaClient_1.prismaMain.scholarship.update({
                where: { id },
                data: {
                    ...(data.name !== undefined ? { name: data.name.trim() } : {}),
                    ...(data.code !== undefined ? { code: data.code?.trim() || null } : {}),
                    ...(data.type !== undefined ? { type: data.type } : {}),
                    ...(data.value !== undefined ? { value } : {}),
                    ...(data.description !== undefined
                        ? { description: data.description?.trim() || null }
                        : {}),
                    ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
                    updatedBy: userId ?? null,
                },
            });
        }
        catch (error) {
            if (error?.code === "P2002") {
                throw new CustomError_1.CustomError("A scholarship with this code already exists", 409);
            }
            throw error;
        }
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.scholarship.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Scholarship not found", 404);
        await prismaClient_1.prismaMain.scholarship.update({
            where: { id },
            data: { deletedAt: new Date(), updatedBy: userId ?? null },
        });
        return null;
    },
    // ── Grants ─────────────────────────────────────────────────────────────
    async listGrants(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = { deletedAt: null };
        if (query.studentId)
            whereClause.studentId = query.studentId;
        if (query.scholarshipId)
            whereClause.scholarshipId = query.scholarshipId;
        if (query.search) {
            whereClause.OR = [
                { note: { contains: query.search, mode: "insensitive" } },
                { scholarship: { name: { contains: query.search, mode: "insensitive" } } },
                {
                    student: {
                        universityRegNo: { contains: query.search, mode: "insensitive" },
                    },
                },
            ];
        }
        const [grants, total] = await Promise.all([
            prismaClient_1.prismaMain.scholarshipGrant.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    scholarship: true,
                    student: { select: STUDENT_SELECT },
                    studentFeeItem: { include: { feeHead: true } },
                },
                orderBy: { grantedAt: "desc" },
            }),
            prismaClient_1.prismaMain.scholarshipGrant.count({ where: whereClause }),
        ]);
        return { data: grants, pagination: { page, limit, total } };
    },
    /**
     * Grants a scholarship to a student: the discount is applied to the
     * student's fee items (so the dues drop immediately) and every touched item
     * gets a grant row as the audit trail.
     */
    async grant(data, userId) {
        const scholarship = await prismaClient_1.prismaMain.scholarship.findFirst({
            where: { id: data.scholarshipId, deletedAt: null, isActive: true },
        });
        if (!scholarship) {
            throw new CustomError_1.CustomError("Scholarship not found or it is not active", 404);
        }
        const student = await prismaClient_1.prismaMain.student.findFirst({
            where: { id: data.studentId, deletedAt: null },
            select: STUDENT_SELECT,
        });
        if (!student)
            throw new CustomError_1.CustomError("Student not found", 404);
        // Which student fee?
        const studentFee = data.studentFeeId
            ? await prismaClient_1.prismaMain.studentFee.findFirst({
                where: { id: data.studentFeeId, studentId: student.id, deletedAt: null },
                include: {
                    items: {
                        where: { deletedAt: null },
                        orderBy: { createdAt: "asc" },
                        include: { feeHead: true },
                    },
                },
            })
            : await prismaClient_1.prismaMain.studentFee.findFirst({
                where: { studentId: student.id, deletedAt: null },
                include: {
                    items: {
                        where: { deletedAt: null },
                        orderBy: { createdAt: "asc" },
                        include: { feeHead: true },
                    },
                },
                orderBy: { createdAt: "desc" },
            });
        if (!studentFee) {
            throw new CustomError_1.CustomError("This student has no fee yet — assign a fee structure first", 400);
        }
        // Which fee items?
        const wanted = data.feeItemIds?.length
            ? studentFee.items.filter((item) => data.feeItemIds.includes(item.id))
            : studentFee.items.filter((item) => !item.isSkipped);
        if (!wanted.length) {
            throw new CustomError_1.CustomError("No fee item to discount for this student", 400);
        }
        if (data.feeItemIds?.length && wanted.length !== data.feeItemIds.length) {
            throw new CustomError_1.CustomError("Some fee items do not belong to this student's fee", 400);
        }
        // A fee item with payments allocated cannot change its amount anymore.
        const allocations = await prismaClient_1.prismaMain.feePaymentAllocation.groupBy({
            by: ["studentFeeItemId"],
            where: { studentFeeItemId: { in: wanted.map((item) => item.id) } },
            _count: { _all: true },
        });
        const paidItems = new Set(allocations
            .filter((row) => row._count._all > 0)
            .map((row) => row.studentFeeItemId));
        if (paidItems.size > 0) {
            throw new CustomError_1.CustomError("Cannot grant a scholarship on a fee that already has payments; cancel those payments first", 409);
        }
        const value = (0, money_1.dec)(scholarship.value, "value");
        const discounts = this.computeDiscounts(scholarship.type, value, wanted.map((item) => ({
            id: item.id,
            amount: (0, money_1.dec)(item.amount, "amount"),
            discount: (0, money_1.dec)(item.discountAmount, "discountAmount"),
        })));
        const reason = `Scholarship: ${scholarship.name}`;
        const grantedAt = new Date();
        // Every row of this action shares one group id, so the whole scholarship
        // can be taken back in one go.
        const grantGroupId = (0, crypto_1.randomUUID)();
        const result = await prismaClient_1.prismaMain.$transaction(async (tx) => {
            const grants = [];
            for (const item of wanted) {
                const discount = discounts.get(item.id);
                if (!discount || discount.isZero())
                    continue;
                const currentDiscount = (0, money_1.dec)(item.discountAmount, "discountAmount");
                const newDiscount = (0, money_1.round2)(currentDiscount.plus(discount));
                const amount = (0, money_1.dec)(item.amount, "amount");
                if (newDiscount.gt(amount)) {
                    throw new CustomError_1.CustomError("The scholarship is bigger than the remaining fee of this item", 400);
                }
                const existingReason = item.discountReason?.trim();
                const newReason = existingReason
                    ? `${existingReason} + ${reason}`
                    : reason;
                await tx.studentFeeItem.update({
                    where: { id: item.id },
                    data: {
                        discountAmount: newDiscount,
                        discountReason: newReason,
                        netAmount: (0, money_1.round2)(amount.minus(newDiscount)),
                        updatedBy: userId ?? null,
                    },
                });
                const grant = await tx.scholarshipGrant.create({
                    data: {
                        scholarshipId: scholarship.id,
                        studentId: student.id,
                        studentFeeId: studentFee.id,
                        studentFeeItemId: item.id,
                        grantGroupId,
                        amount: discount,
                        note: data.note?.trim() || null,
                        grantedBy: userId ?? null,
                        grantedAt,
                        createdBy: userId ?? null,
                        updatedBy: userId ?? null,
                    },
                });
                grants.push(grant);
            }
            if (!grants.length) {
                throw new CustomError_1.CustomError("The scholarship amount is zero for every selected fee item", 400);
            }
            const { writeAudit } = await Promise.resolve().then(() => __importStar(require("@/lib/audit")));
            await writeAudit(tx, {
                entity: "ScholarshipGrant",
                entityId: grants[0].id,
                action: "GRANT",
                newValues: {
                    scholarship: scholarship.name,
                    student: fullName(student),
                    amount: (0, money_1.moneyStr)(value),
                    items: grants.length,
                },
                userId,
            });
            return grants;
        });
        return {
            scholarship,
            student,
            studentFeeId: studentFee.id,
            grants: result,
            totalAmount: (0, money_1.moneyStr)(result.reduce((sum, grant) => sum.plus(grant.amount), (0, money_1.dec)(0, "amount"))),
        };
    },
    /**
     * Takes the scholarship back: the discount is removed from every fee item
     * the same grant action touched.
     */
    async revoke(grantId, userId) {
        const grant = await prismaClient_1.prismaMain.scholarshipGrant.findFirst({
            where: { id: grantId, deletedAt: null },
            include: { scholarship: true, studentFeeItem: true },
        });
        if (!grant)
            throw new CustomError_1.CustomError("Scholarship grant not found", 404);
        if (grant.revokedAt) {
            throw new CustomError_1.CustomError("This scholarship was already revoked", 409);
        }
        // All rows of the same action.
        const group = await prismaClient_1.prismaMain.scholarshipGrant.findMany({
            where: { grantGroupId: grant.grantGroupId, deletedAt: null },
            include: { studentFeeItem: true },
        });
        for (const row of group) {
            const item = row.studentFeeItem;
            if (!item)
                continue;
            const allocations = await prismaClient_1.prismaMain.feePaymentAllocation.count({
                where: { studentFeeItemId: item.id },
            });
            if (allocations > 0) {
                throw new CustomError_1.CustomError("Cannot revoke a scholarship on a fee that already has payments; cancel those payments first", 409);
            }
            const amount = (0, money_1.dec)(item.amount, "amount");
            const currentDiscount = (0, money_1.dec)(item.discountAmount, "discountAmount");
            const grantAmount = (0, money_1.dec)(row.amount, "amount");
            const left = currentDiscount.minus(grantAmount);
            const newDiscount = (0, money_1.round2)(left.isNegative() ? (0, money_1.dec)(0, "amount") : left);
            // Keep the reason readable when only the scholarship was there.
            const reason = item.discountReason?.includes("Scholarship:")
                ? item.discountReason
                    .split(" + ")
                    .filter((part) => !part.startsWith("Scholarship:"))
                    .join(" + ") || null
                : item.discountReason;
            await prismaClient_1.prismaMain.studentFeeItem.update({
                where: { id: item.id },
                data: {
                    discountAmount: newDiscount,
                    discountReason: reason,
                    netAmount: (0, money_1.round2)(amount.minus(newDiscount)),
                    updatedBy: userId ?? null,
                },
            });
        }
        await prismaClient_1.prismaMain.scholarshipGrant.updateMany({
            where: { grantGroupId: grant.grantGroupId, revokedAt: null },
            data: {
                revokedAt: new Date(),
                revokedBy: userId ?? null,
                updatedBy: userId ?? null,
            },
        });
        const { writeAudit } = await Promise.resolve().then(() => __importStar(require("@/lib/audit")));
        await prismaClient_1.prismaMain.$transaction(async (tx) => {
            await writeAudit(tx, {
                entity: "ScholarshipGrant",
                entityId: grant.id,
                action: "REVOKE",
                newValues: { scholarship: grant.scholarship.name },
                userId,
            });
        });
        return { id: grant.id, grantGroupId: grant.grantGroupId, revoked: true };
    },
    /**
     * How much of the scholarship lands on each fee item.
     *  - PERCENT: value% of every selected item.
     *  - FIXED: the amount is spread over the items, proportional to their
     *    amount, and never bigger than what is still due on an item.
     */
    computeDiscounts(type, value, items) {
        const result = new Map();
        if (items.length === 0)
            return result;
        if (type === PERCENT) {
            const pct = value;
            if (pct.isNegative() || pct.gt(100)) {
                throw new CustomError_1.CustomError("A percentage scholarship must be between 0 and 100", 400);
            }
            for (const item of items) {
                result.set(item.id, (0, money_1.round2)(item.amount.times(pct).div(100)));
            }
            return result;
        }
        // FIXED: proportional split, capped by the remaining due per item.
        const totalAmount = items.reduce((sum, item) => sum.plus(item.amount), (0, money_1.dec)(0, "amount"));
        let remaining = value;
        for (const item of items) {
            if (remaining.lessThanOrEqualTo(0))
                break;
            const share = totalAmount.isZero()
                ? (0, money_1.dec)(0, "amount")
                : (0, money_1.round2)(value.times(item.amount).div(totalAmount));
            const capped = (0, money_1.round2)(share.gt(remaining) ? remaining : share);
            result.set(item.id, capped);
            remaining = remaining.minus(capped);
        }
        return result;
    },
};
