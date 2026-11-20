"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HolidayService = void 0;
exports.studentHolidayDateBs = studentHolidayDateBs;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
const audit_1 = require("@/lib/audit");
const bs_date_1 = require("@/utils/bs-date");
/**
 * Set of active holiday dates that apply to students, optionally limited to a
 * BS date range. Attendance percentages consult this so that sessions held on
 * holidays are not counted as working days. Degrades to an empty set on DB
 * errors, mirroring the graceful degradation of HolidayService.index.
 */
async function studentHolidayDateBs(range) {
    try {
        const rows = await prismaClient_1.prismaMain.holiday.findMany({
            where: {
                deletedAt: null,
                appliesToStudents: true,
                ...(range?.fromBs || range?.toBs
                    ? {
                        dateBs: {
                            ...(range.fromBs ? { gte: range.fromBs } : {}),
                            ...(range.toBs ? { lte: range.toBs } : {}),
                        },
                    }
                    : {}),
            },
            select: { dateBs: true },
        });
        return new Set(rows.map((row) => row.dateBs));
    }
    catch {
        return new Set();
    }
}
const SELECT = {
    id: true,
    dateBs: true,
    name: true,
    type: true,
    description: true,
    appliesToEmployees: true,
    appliesToStudents: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
};
exports.HolidayService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10, 500);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const where = query.includeDeleted ? {} : { deletedAt: null };
        if (query.search)
            where.name = { contains: query.search, mode: "insensitive" };
        if (query.yearBs && query.monthBs) {
            const prefix = `${query.yearBs}-${String(query.monthBs).padStart(2, "0")}`;
            where.dateBs = { startsWith: prefix };
        }
        else if (query.yearBs) {
            where.dateBs = { startsWith: String(query.yearBs) };
        }
        if (query.appliesToStudents !== undefined)
            where.appliesToStudents = query.appliesToStudents;
        if (query.appliesToEmployees !== undefined)
            where.appliesToEmployees = query.appliesToEmployees;
        const orderBy = {
            [query.sort ?? "dateBs"]: query.order ?? "asc",
        };
        try {
            const [holidays, total] = await Promise.all([
                prismaClient_1.prismaMain.holiday.findMany({ where, skip, take: (0, queryFilters_1.toPrismaTake)(limit), select: SELECT, orderBy }),
                prismaClient_1.prismaMain.holiday.count({ where }),
            ]);
            return { data: holidays, pagination: { page, limit, total } };
        }
        catch {
            // Dev DB schema drift/missing table: degrade gracefully.
            return { data: [], pagination: { page, limit, total: 0 } };
        }
    },
    async getById(id) {
        const holiday = await prismaClient_1.prismaMain.holiday.findFirst({ where: { id, deletedAt: null }, select: SELECT });
        if (!holiday)
            throw new CustomError_1.CustomError("Holiday not found", 404);
        return holiday;
    },
    async getByDate(dateBs) {
        try {
            return await prismaClient_1.prismaMain.holiday.findFirst({
                where: { dateBs, deletedAt: null },
                select: SELECT,
            });
        }
        catch {
            return null;
        }
    },
    async create(data, userId) {
        const duplicate = await prismaClient_1.prismaMain.holiday.findFirst({ where: { dateBs: data.dateBs } });
        if (duplicate) {
            if (duplicate.deletedAt) {
                throw new CustomError_1.CustomError(`A deleted holiday already exists for ${data.dateBs}; restore it instead`, 409);
            }
            throw new CustomError_1.CustomError(`A holiday already exists for ${data.dateBs}`, 409);
        }
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            const holiday = await tx.holiday.create({ data: { ...data, createdBy: userId }, select: SELECT });
            await (0, audit_1.writeAudit)(tx, {
                entity: "Holiday",
                entityId: holiday.id,
                action: "CREATE",
                newValues: holiday,
                userId,
            });
            return holiday;
        });
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.holiday.findFirst({ where: { id, deletedAt: null } });
        if (!existing)
            throw new CustomError_1.CustomError("Holiday not found", 404);
        if (data.dateBs && data.dateBs !== existing.dateBs) {
            const duplicate = await prismaClient_1.prismaMain.holiday.findFirst({ where: { dateBs: data.dateBs, NOT: { id } } });
            if (duplicate)
                throw new CustomError_1.CustomError(`A holiday already exists for ${data.dateBs}`, 409);
        }
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            const holiday = await tx.holiday.update({
                where: { id },
                data: { ...data, updatedBy: userId },
                select: SELECT,
            });
            await (0, audit_1.writeAudit)(tx, {
                entity: "Holiday",
                entityId: id,
                action: "UPDATE",
                oldValues: existing,
                newValues: holiday,
                userId,
            });
            return holiday;
        });
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.holiday.findFirst({ where: { id, deletedAt: null } });
        if (!existing)
            throw new CustomError_1.CustomError("Holiday not found", 404);
        await prismaClient_1.prismaMain.$transaction(async (tx) => {
            await tx.holiday.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: userId } });
            await (0, audit_1.writeAudit)(tx, {
                entity: "Holiday",
                entityId: id,
                action: "DELETE",
                oldValues: existing,
                userId,
            });
        });
        return null;
    },
    async restore(id, userId) {
        const existing = await prismaClient_1.prismaMain.holiday.findUnique({ where: { id } });
        if (!existing)
            throw new CustomError_1.CustomError("Holiday not found", 404);
        if (!existing.deletedAt)
            throw new CustomError_1.CustomError("Holiday is not deleted", 409);
        const active = await prismaClient_1.prismaMain.holiday.findFirst({ where: { dateBs: existing.dateBs, deletedAt: null } });
        if (active)
            throw new CustomError_1.CustomError(`A holiday already exists for ${existing.dateBs}`, 409);
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            const holiday = await tx.holiday.update({
                where: { id },
                data: { deletedAt: null, updatedBy: userId },
                select: SELECT,
            });
            await (0, audit_1.writeAudit)(tx, {
                entity: "Holiday",
                entityId: id,
                action: "RESTORE",
                newValues: holiday,
                userId,
            });
            return holiday;
        });
    },
    /** CSV-style bulk import; duplicate dates are reported per row, never silently skipped. */
    async bulkImport(data, userId) {
        const results = [];
        for (let index = 0; index < data.holidays.length; index += 1) {
            const row = data.holidays[index];
            try {
                await this.create(row, userId);
                results.push({ index, dateBs: row.dateBs, success: true });
            }
            catch (error) {
                results.push({
                    index,
                    dateBs: row.dateBs,
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to import",
                });
            }
        }
        return {
            imported: results.filter((row) => row.success).length,
            failed: results.filter((row) => !row.success).length,
            results,
        };
    },
    /**
     * Creates one holiday per date sharing the same name/type/description in a
     * SINGLE transaction. Dates that already have a holiday row (active or
     * soft-deleted — dateBs is globally unique) are skipped, never fatal.
     */
    async bulkCreate(data, userId) {
        const dates = [...new Set(data.dates)];
        const existing = await prismaClient_1.prismaMain.holiday.findMany({
            where: { dateBs: { in: dates } },
            select: { dateBs: true },
        });
        const taken = new Set(existing.map((row) => row.dateBs));
        const toCreate = dates.filter((dateBs) => !taken.has(dateBs));
        const skippedDates = dates.filter((dateBs) => taken.has(dateBs));
        if (toCreate.length > 0) {
            await prismaClient_1.prismaMain.$transaction(async (tx) => {
                await tx.holiday.createMany({
                    data: toCreate.map((dateBs) => ({
                        dateBs,
                        name: data.name,
                        type: data.type,
                        description: data.description ?? null,
                        appliesToEmployees: data.appliesToEmployees,
                        appliesToStudents: data.appliesToStudents,
                        createdBy: userId ?? null,
                    })),
                });
                await (0, audit_1.writeAudit)(tx, {
                    entity: "Holiday",
                    action: "BULK_CREATE",
                    newValues: {
                        name: data.name,
                        type: data.type,
                        requested: dates.length,
                        created: toCreate.length,
                        skipped: skippedDates.length,
                        dates: toCreate,
                    },
                    userId,
                });
            });
        }
        return {
            requested: dates.length,
            created: toCreate.length,
            skipped: skippedDates.length,
            skippedDates,
        };
    },
    /** Creates a holiday for every Saturday of a BS year (idempotent). */
    async generateWeeklyOffs(input, userId) {
        const dates = [];
        for (let month = 1; month <= 12; month += 1) {
            for (const dateBs of (0, bs_date_1.listBsDatesInMonth)(input.yearBs, month)) {
                if ((0, bs_date_1.isSaturdayBs)(dateBs))
                    dates.push(dateBs);
            }
        }
        const existing = await prismaClient_1.prismaMain.holiday.findMany({
            where: { dateBs: { in: dates } },
            select: { dateBs: true },
        });
        const taken = new Set(existing.map((row) => row.dateBs));
        const toCreate = dates.filter((dateBs) => !taken.has(dateBs));
        if (toCreate.length > 0) {
            await prismaClient_1.prismaMain.$transaction(async (tx) => {
                await tx.holiday.createMany({
                    data: toCreate.map((dateBs) => ({
                        dateBs,
                        name: input.name,
                        appliesToEmployees: true,
                        appliesToStudents: true,
                        createdBy: userId ?? null,
                    })),
                });
                await (0, audit_1.writeAudit)(tx, {
                    entity: "Holiday",
                    action: "WEEKLY_OFF_GENERATE",
                    newValues: { yearBs: input.yearBs, created: toCreate.length, skipped: dates.length - toCreate.length },
                    userId,
                });
            });
        }
        return {
            yearBs: input.yearBs,
            totalSaturdays: dates.length,
            created: toCreate.length,
            skippedExisting: dates.length - toCreate.length,
        };
    },
};
