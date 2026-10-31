import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { JournalEntryCreateInput } from "./validator";

export const JournalEntryService = {
  async index(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query.search) {
      whereClause.OR = [
        { entryNo: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [entries, total] = await Promise.all([
      prismaMain.journalEntry.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          lines: true,
          source: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.journalEntry.count({ where: whereClause }),
    ]);

    return {
      data: entries,
      pagination: { page, limit, total },
    };
  },

  async create(data: JournalEntryCreateInput, userId?: string) {
    // Validate fiscal year exists
    const year = await prismaMain.fiscalYear.findFirst({
      where: { id: data.fiscalYearId, deletedAt: null },
    });
    if (!year) {
      throw new CustomError("Fiscal year not found", 404);
    }

    try {
      const entry = await prismaMain.journalEntry.create({
        data: {
          ...data,
          createdBy: userId,
        },
        include: {
          lines: true,
          source: true,
        },
      });
      return entry;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("A journal entry with this number already exists", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const entry = await prismaMain.journalEntry.findFirst({
      where: { id, deletedAt: null },
      include: {
        lines: true,
        source: true,
      },
    });

    if (!entry) {
      throw new CustomError("Journal entry not found", 404);
    }

    return entry;
  },

  async delete(id: string, userId?: string) {
    const existing = await prismaMain.journalEntry.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("Journal entry not found", 404);
    }

    await prismaMain.journalEntry.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return null;
  },
};
