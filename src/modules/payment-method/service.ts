import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { ACCOUNT_SAFE_SELECT } from "@/utils/safe-select";
import { CustomError } from "@/errors/CustomError";
import {
  PaymentMethodCreateInput,
  PaymentMethodUpdateInput,
} from "./validator";

async function assertValidAccount(accountId: string) {
  const account = await prismaMain.account.findFirst({
    where: { id: accountId, deletedAt: null },
    select: { id: true, isActive: true, isGroup: true, type: true },
  });
  if (!account) throw new CustomError("Ledger account not found", 404);
  if (!account.isActive || account.isGroup)
    throw new CustomError(
      "Payment method account must be an active, non-group account",
      400,
    );
  if (account.type !== "ASSET")
    throw new CustomError("Payment method must map to an ASSET account", 400);
}

export const PaymentMethodService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 50);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: Record<string, unknown> = { deletedAt: null };
    if (query.search) {
      whereClause.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { code: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [paymentMethods, total] = await Promise.all([
      prismaMain.paymentMethod.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: { account: { select: ACCOUNT_SAFE_SELECT } },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.paymentMethod.count({ where: whereClause }),
    ]);

    return { data: paymentMethods, pagination: { page, limit, total } };
  },

  async create(data: PaymentMethodCreateInput, userId?: string) {
    if (data.accountId) await assertValidAccount(data.accountId);
    try {
      return await prismaMain.paymentMethod.create({
        data: {
          name: data.name,
          code: data.code,
          accountId: data.accountId ?? null,
          isActive: data.isActive ?? true,
          createdBy: userId,
        },
        include: { account: { select: ACCOUNT_SAFE_SELECT } },
      });
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === "P2002")
        throw new CustomError(
          "A payment method with this code already exists",
          409,
        );
      throw error;
    }
  },

  async getById(id: string) {
    const paymentMethod = await prismaMain.paymentMethod.findFirst({
      where: { id, deletedAt: null },
      include: { account: { select: ACCOUNT_SAFE_SELECT } },
    });
    if (!paymentMethod) throw new CustomError("Payment method not found", 404);
    return paymentMethod;
  },

  async update(id: string, data: PaymentMethodUpdateInput, userId?: string) {
    const existing = await prismaMain.paymentMethod.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new CustomError("Payment method not found", 404);
    if (data.accountId) await assertValidAccount(data.accountId);
    try {
      return await prismaMain.paymentMethod.update({
        where: { id },
        data: { ...data, updatedBy: userId },
        include: { account: { select: ACCOUNT_SAFE_SELECT } },
      });
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === "P2002")
        throw new CustomError(
          "A payment method with this code already exists",
          409,
        );
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.paymentMethod.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { paymentLines: true } } },
    });
    if (!existing) throw new CustomError("Payment method not found", 404);
    if (existing._count.paymentLines > 0)
      throw new CustomError(
        "Payment method has receipt lines; deactivate instead",
        409,
      );
    await prismaMain.paymentMethod.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
    return null;
  },
};
