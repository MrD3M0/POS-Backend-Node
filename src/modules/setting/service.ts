import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError } from "@/errors/CustomError";
import {
  assertKnownSettingKey,
  getSettingDefinition,
  invalidateSettingCache,
  listEffectiveSettings,
  validateSettingValue,
} from "@/lib/settings";
import { SettingCreateInput, SettingUpdateInput } from "./validator";

export const SettingService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: any = { deletedAt: null };
    if (query.search) {
      whereClause.OR = [
        { key: { contains: query.search, mode: "insensitive" } },
        { value: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [settings, total] = await Promise.all([
      prismaMain.setting.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.setting.count({ where: whereClause }),
    ]);

    return { settings, pagination: { page, limit, total } };
  },

  async create(data: SettingCreateInput, userId?: string) {
    // Typed registry: only known keys with valid values may be created
    assertKnownSettingKey(data.key);
    validateSettingValue(data.key, data.value);

    const existing = await prismaMain.setting.findFirst({
      where: { key: data.key, deletedAt: null },
    });
    if (existing) throw new CustomError("A setting with this key already exists", 409);

    try {
      const setting = await prismaMain.setting.create({
        data: { ...data, createdBy: userId },
      });
      invalidateSettingCache(data.key);
      return setting;
    } catch (error: any) {
      if (error.code === "P2002") throw new CustomError("A setting with this key already exists", 409);
      throw error;
    }
  },

  async getById(id: string) {
    const setting = await prismaMain.setting.findFirst({
      where: { id, deletedAt: null },
    });
    if (!setting) throw new CustomError("Setting not found", 404);
    return setting;
  },

  async getByKey(key: string) {
    assertKnownSettingKey(key);
    const setting = await prismaMain.setting.findFirst({
      where: { key, deletedAt: null },
    });
    if (!setting) throw new CustomError("Setting not found", 404);
    return setting;
  },

  /**
   * Creates or updates a setting by key. Registry defaults have no stored row
   * yet, so the settings screen saves through this instead of PATCH /:id.
   */
  async upsertByKey(key: string, value: string, userId?: string, role?: string) {
    assertKnownSettingKey(key);
    // A principal owns the college identity (name, logo, contacts, ID cards)
    // but not attendance / payroll / fee behaviour.
    if (role === "PRINCIPAL" && getSettingDefinition(key).group !== "college") {
      throw new CustomError("A principal may only change college identity settings", 403);
    }
    validateSettingValue(key, value);

    const existing = await prismaMain.setting.findFirst({
      where: { key, deletedAt: null },
    });

    const saved =
      existing
        ? await prismaMain.setting.update({
            where: { id: existing.id },
            data: { value, updatedBy: userId },
          })
        : await prismaMain.setting.create({
            data: { key, value, createdBy: userId },
          });

    invalidateSettingCache(key);
    return saved;
  },

  /** Typed registry view (definitions + defaults merged with stored rows). */
  async effective() {
    return listEffectiveSettings();
  },

  /**
   * College identity used on printed documents (student ID cards). Open to
   * every signed-in user because it is public identity, not configuration.
   */
  async institution() {
    const settings = await listEffectiveSettings();
    const values = new Map(settings.map((setting) => [setting.key, setting.value]));
    const text = (key: string) => values.get(key) ?? "";
    const programmes = text("COLLEGE_PROGRAMMES")
      .split(",")
      .map((programme) => programme.trim())
      .filter(Boolean);

    return {
      affiliation: text("COLLEGE_AFFILIATION"),
      name: text("COLLEGE_NAME"),
      address: text("COLLEGE_ADDRESS"),
      phone: text("COLLEGE_PHONE"),
      since: text("COLLEGE_SINCE"),
      website: text("COLLEGE_WEBSITE"),
      email: text("COLLEGE_EMAIL"),
      pan: text("COLLEGE_PAN"),
      programmes,
      logoUrl: text("COLLEGE_LOGO_URL"),
      signatureUrl: text("COLLEGE_SIGNATURE_URL"),
      signatureLabel: text("COLLEGE_SIGNATURE_LABEL") || "Principal",
    };
  },

  async update(id: string, data: SettingUpdateInput, userId?: string, role?: string) {
    const existing = await prismaMain.setting.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new CustomError("Setting not found", 404);

    // Key changes are forbidden — keys are registry identifiers, not free text
    if (data.key && data.key !== existing.key) {
      throw new CustomError("Setting key cannot be changed", 400);
    }
    if (role === "PRINCIPAL" && getSettingDefinition(existing.key).group !== "college") {
      throw new CustomError("A principal may only change college identity settings", 403);
    }
    if (data.value !== undefined) {
      validateSettingValue(existing.key, data.value);
    }

    try {
      const updated = await prismaMain.setting.update({
        where: { id },
        data: {
          ...(data.value !== undefined ? { value: data.value } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          updatedBy: userId,
        },
      });
      invalidateSettingCache(existing.key);
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") throw new CustomError("A setting with this key already exists", 409);
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.setting.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new CustomError("Setting not found", 404);
    await prismaMain.setting.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
    invalidateSettingCache(existing.key);
    return null;
  },
};
