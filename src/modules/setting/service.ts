import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { SettingCreateInput, SettingUpdateInput } from "./validator";

export const SettingService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

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
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.setting.count({ where: whereClause }),
    ]);

    return {
      settings,
      pagination: {
        page,
        limit,
        total,
      },
    };
  },

  async create(data: SettingCreateInput, userId?: string) {
    // Check duplicate key
    const existing = await prismaMain.setting.findFirst({
      where: { key: data.key, deletedAt: null },
    });

    if (existing) {
      throw new CustomError("A setting with this key already exists", 409);
    }

    try {
      const setting = await prismaMain.setting.create({
        data: {
          ...data,
          createdBy: userId,
        },
      });
      return setting;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A setting with this key already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const setting = await prismaMain.setting.findFirst({
      where: { id, deletedAt: null },
    });

    if (!setting) {
      throw new CustomError("Setting not found", 404);
    }

    return setting;
  },

  async getByKey(key: string) {
    const setting = await prismaMain.setting.findFirst({
      where: { key, deletedAt: null },
    });

    if (!setting) {
      throw new CustomError("Setting not found", 404);
    }

    return setting;
  },

  async update(id: string, data: SettingUpdateInput, userId?: string) {
    const existing = await prismaMain.setting.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Setting not found", 404);
    }

    // If key is being updated, check for uniqueness
    if (data.key && data.key !== existing.key) {
      const duplicate = await prismaMain.setting.findFirst({
        where: {
          key: data.key,
          NOT: { id },
          deletedAt: null,
        },
      });

      if (duplicate) {
        throw new CustomError("A setting with this key already exists", 409);
      }
    }

    try {
      const updated = await prismaMain.setting.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        },
      });
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A setting with this key already exists", 409);
      }
      throw error;
    }
  },

  delete: async (id: string, userId?: string) => {
    const existing = await prismaMain.setting.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Setting not found", 404);
    }

    await prismaMain.setting.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
