import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import { dec, moneyStr, round2 } from "@/lib/money";
import { randomUUID } from "crypto";
import type { Prisma } from "../../generated/prisma/client.js";
import {
  ScholarshipCreateInput,
  ScholarshipGrantInput,
  ScholarshipUpdateInput,
} from "./validator";

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
} as const;

function fullName(student: {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
}): string {
  return [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ");
}

export const ScholarshipService = {
  // ── Schemes ────────────────────────────────────────────────────────────
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: Record<string, unknown> = { deletedAt: null };
    if (query.search) {
      whereClause.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { code: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [scholarships, total] = await Promise.all([
      prismaMain.scholarship.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: { _count: { select: { grants: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.scholarship.count({ where: whereClause }),
    ]);

    return { data: scholarships, pagination: { page, limit, total } };
  },

  async create(data: ScholarshipCreateInput, userId?: string) {
    if (data.type === PERCENT && Number(data.value) > 100) {
      throw new CustomError(
        "A percentage scholarship cannot be above 100",
        400,
      );
    }
    try {
      return await prismaMain.scholarship.create({
        data: {
          name: data.name.trim(),
          code: data.code?.trim() || null,
          type: data.type,
          value: dec(data.value, "value"),
          description: data.description?.trim() || null,
          isActive: data.isActive ?? true,
          createdBy: userId ?? null,
          updatedBy: userId ?? null,
        },
      });
    } catch (error: unknown) {
      if ((error as { code?: string } | null)?.code === "P2002") {
        throw new CustomError(
          "A scholarship with this code already exists",
          409,
        );
      }
      throw error;
    }
  },

  async update(id: string, data: ScholarshipUpdateInput, userId?: string) {
    const existing = await prismaMain.scholarship.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new CustomError("Scholarship not found", 404);

    const type = data.type ?? existing.type;
    const value = data.value !== undefined ? dec(data.value, "value") : existing.value;
    if (type === PERCENT && Number(value) > 100) {
      throw new CustomError(
        "A percentage scholarship cannot be above 100",
        400,
      );
    }

    try {
      return await prismaMain.scholarship.update({
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
    } catch (error: unknown) {
      if ((error as { code?: string } | null)?.code === "P2002") {
        throw new CustomError(
          "A scholarship with this code already exists",
          409,
        );
      }
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.scholarship.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new CustomError("Scholarship not found", 404);
    await prismaMain.scholarship.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: userId ?? null },
    });
    return null;
  },

  // ── Grants ─────────────────────────────────────────────────────────────
  async listGrants(query: {
    page?: number;
    limit?: number;
    search?: string;
    studentId?: string;
    scholarshipId?: string;
  }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: Record<string, unknown> = { deletedAt: null };
    if (query.studentId) whereClause.studentId = query.studentId;
    if (query.scholarshipId) whereClause.scholarshipId = query.scholarshipId;
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
      prismaMain.scholarshipGrant.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: {
          scholarship: true,
          student: { select: STUDENT_SELECT },
          studentFeeItem: { include: { feeHead: true } },
        },
        orderBy: { grantedAt: "desc" },
      }),
      prismaMain.scholarshipGrant.count({ where: whereClause }),
    ]);

    return { data: grants, pagination: { page, limit, total } };
  },

  /**
   * Grants a scholarship to a student: the discount is applied to the
   * student's fee items (so the dues drop immediately) and every touched item
   * gets a grant row as the audit trail.
   */
  async grant(data: ScholarshipGrantInput, userId?: string) {
    const scholarship = await prismaMain.scholarship.findFirst({
      where: { id: data.scholarshipId, deletedAt: null, isActive: true },
    });
    if (!scholarship) {
      throw new CustomError(
        "Scholarship not found or it is not active",
        404,
      );
    }

    const student = await prismaMain.student.findFirst({
      where: { id: data.studentId, deletedAt: null },
      select: STUDENT_SELECT,
    });
    if (!student) throw new CustomError("Student not found", 404);

    // Which student fee?
    const studentFee = data.studentFeeId
      ? await prismaMain.studentFee.findFirst({
          where: { id: data.studentFeeId, studentId: student.id, deletedAt: null },
          include: {
            items: {
              where: { deletedAt: null },
              orderBy: { createdAt: "asc" },
              include: { feeHead: true },
            },
          },
        })
      : await prismaMain.studentFee.findFirst({
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
      throw new CustomError(
        "This student has no fee yet — assign a fee structure first",
        400,
      );
    }

    // Which fee items?
    const wanted = data.feeItemIds?.length
      ? studentFee.items.filter((item) => data.feeItemIds!.includes(item.id))
      : studentFee.items.filter((item) => !item.isSkipped);
    if (!wanted.length) {
      throw new CustomError(
        "No fee item to discount for this student",
        400,
      );
    }
    if (data.feeItemIds?.length && wanted.length !== data.feeItemIds.length) {
      throw new CustomError(
        "Some fee items do not belong to this student's fee",
        400,
      );
    }

    // A fee item with payments allocated cannot change its amount anymore.
    const allocations = await prismaMain.feePaymentAllocation.groupBy({
      by: ["studentFeeItemId"],
      where: { studentFeeItemId: { in: wanted.map((item) => item.id) } },
      _count: { _all: true },
    });
    const paidItems = new Set(
      allocations
        .filter((row) => row._count._all > 0)
        .map((row) => row.studentFeeItemId),
    );
    if (paidItems.size > 0) {
      throw new CustomError(
        "Cannot grant a scholarship on a fee that already has payments; cancel those payments first",
        409,
      );
    }

    const value = dec(scholarship.value, "value");
    const discounts = this.computeDiscounts(
      scholarship.type,
      value,
      wanted.map((item) => ({
        id: item.id,
        amount: dec(item.amount, "amount"),
        discount: dec(item.discountAmount, "discountAmount"),
      })),
    );

    const reason = `Scholarship: ${scholarship.name}`;
    const grantedAt = new Date();
    // Every row of this action shares one group id, so the whole scholarship
    // can be taken back in one go.
    const grantGroupId = randomUUID();

    const result = await prismaMain.$transaction(async (tx) => {
      const grants = [];
      for (const item of wanted) {
        const discount = discounts.get(item.id);
        if (!discount || discount.isZero()) continue;

        const currentDiscount = dec(item.discountAmount, "discountAmount");
        const newDiscount = round2(currentDiscount.plus(discount));
        const amount = dec(item.amount, "amount");
        if (newDiscount.gt(amount)) {
          throw new CustomError(
            "The scholarship is bigger than the remaining fee of this item",
            400,
          );
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
            netAmount: round2(amount.minus(newDiscount)),
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
        throw new CustomError(
          "The scholarship amount is zero for every selected fee item",
          400,
        );
      }

      const { writeAudit } = await import("@/lib/audit");
      await writeAudit(tx, {
        entity: "ScholarshipGrant",
        entityId: grants[0].id,
        action: "GRANT",
        newValues: {
          scholarship: scholarship.name,
          student: fullName(student),
          amount: moneyStr(value),
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
      totalAmount: moneyStr(
        result.reduce(
          (sum, grant) => sum.plus(grant.amount),
          dec(0, "amount"),
        ),
      ),
    };
  },

  /**
   * Takes the scholarship back: the discount is removed from every fee item
   * the same grant action touched.
   */
  async revoke(grantId: string, userId?: string) {
    const grant = await prismaMain.scholarshipGrant.findFirst({
      where: { id: grantId, deletedAt: null },
      include: { scholarship: true, studentFeeItem: true },
    });
    if (!grant) throw new CustomError("Scholarship grant not found", 404);
    if (grant.revokedAt) {
      throw new CustomError("This scholarship was already revoked", 409);
    }

    // All rows of the same action.
    const group = await prismaMain.scholarshipGrant.findMany({
      where: { grantGroupId: grant.grantGroupId, deletedAt: null },
      include: { studentFeeItem: true },
    });

    for (const row of group) {
      const item = row.studentFeeItem;
      if (!item) continue;

      const allocations = await prismaMain.feePaymentAllocation.count({
        where: { studentFeeItemId: item.id },
      });
      if (allocations > 0) {
        throw new CustomError(
          "Cannot revoke a scholarship on a fee that already has payments; cancel those payments first",
          409,
        );
      }

      const amount = dec(item.amount, "amount");
      const currentDiscount = dec(item.discountAmount, "discountAmount");
      const grantAmount = dec(row.amount, "amount");
      const left = currentDiscount.minus(grantAmount);
      const newDiscount = round2(left.isNegative() ? dec(0, "amount") : left);

      // Keep the reason readable when only the scholarship was there.
      const reason = item.discountReason?.includes("Scholarship:")
        ? item.discountReason
            .split(" + ")
            .filter((part) => !part.startsWith("Scholarship:"))
            .join(" + ") || null
        : item.discountReason;

      await prismaMain.studentFeeItem.update({
        where: { id: item.id },
        data: {
          discountAmount: newDiscount,
          discountReason: reason,
          netAmount: round2(amount.minus(newDiscount)),
          updatedBy: userId ?? null,
        },
      });
    }

    await prismaMain.scholarshipGrant.updateMany({
      where: { grantGroupId: grant.grantGroupId, revokedAt: null },
      data: {
        revokedAt: new Date(),
        revokedBy: userId ?? null,
        updatedBy: userId ?? null,
      },
    });

    const { writeAudit } = await import("@/lib/audit");
    await prismaMain.$transaction(async (tx) => {
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
  computeDiscounts(
    type: string,
    value: Prisma.Decimal,
    items: { id: string; amount: Prisma.Decimal; discount: Prisma.Decimal }[],
  ): Map<string, Prisma.Decimal> {
    const result = new Map<string, Prisma.Decimal>();
    if (items.length === 0) return result;

    if (type === PERCENT) {
      const pct = value;
      if (pct.isNegative() || pct.gt(100)) {
        throw new CustomError(
          "A percentage scholarship must be between 0 and 100",
          400,
        );
      }
      for (const item of items) {
        result.set(item.id, round2(item.amount.times(pct).div(100)));
      }
      return result;
    }

    // FIXED: proportional split, capped by the remaining due per item.
    const totalAmount = items.reduce((sum, item) => sum.plus(item.amount), dec(0, "amount"));
    let remaining = value;
    for (const item of items) {
      if (remaining.lessThanOrEqualTo(0)) break;
      const share = totalAmount.isZero()
        ? dec(0, "amount")
        : round2(value.times(item.amount).div(totalAmount));
      const capped = round2(
        share.gt(remaining) ? remaining : share,
      );
      result.set(item.id, capped);
      remaining = remaining.minus(capped);
    }
    return result;
  },
};
