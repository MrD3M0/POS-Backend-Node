"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeriodService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
// HH:mm strings compare chronologically. Periods are half-open [start, end):
// overlap iff newStart < existingEnd AND existingStart < newEnd.
async function assertNoOverlap(startTime, endTime, excludeId) {
    const existing = await prismaClient_1.prismaMain.period.findMany({
        where: { deletedAt: null, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
        select: { id: true, periodNumber: true, name: true, startTime: true, endTime: true },
    });
    for (const e of existing) {
        if (startTime < e.endTime && e.startTime < endTime) {
            throw new CustomError_1.CustomError(`Period ${startTime}-${endTime} overlaps period ${e.periodNumber} (${e.name}) ${e.startTime}-${e.endTime}`, 409);
        }
    }
}
exports.PeriodService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {
            deletedAt: null,
        };
        if (query.search) {
            whereClause.OR = [
                { name: { contains: query.search, mode: "insensitive" } },
            ];
        }
        if (query.isActive !== undefined) {
            whereClause.isActive = query.isActive;
        }
        const [periods, total] = await Promise.all([
            prismaClient_1.prismaMain.period.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    sessions: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.period.count({ where: whereClause }),
        ]);
        return {
            periods,
            pagination: {
                page,
                limit,
                total,
            },
        };
    },
    async create(data, userId) {
        if (data.endTime <= data.startTime) {
            throw new CustomError_1.CustomError("endTime must be after startTime", 400);
        }
        // periodNumber is @unique (schema).
        const existing = await prismaClient_1.prismaMain.period.findFirst({
            where: {
                periodNumber: data.periodNumber,
                deletedAt: null,
            },
        });
        if (existing) {
            throw new CustomError_1.CustomError("A period with this period number already exists", 409);
        }
        await assertNoOverlap(data.startTime, data.endTime);
        try {
            const period = await prismaClient_1.prismaMain.period.create({
                data: {
                    ...data,
                    createdBy: userId,
                },
                include: {
                    sessions: true,
                },
            });
            return period;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A period with this period number already exists", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const period = await prismaClient_1.prismaMain.period.findFirst({
            where: { id, deletedAt: null },
            include: {
                sessions: true,
            },
        });
        if (!period) {
            throw new CustomError_1.CustomError("Period not found", 404);
        }
        return period;
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.period.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Period not found", 404);
        }
        const targetPeriodNumber = data.periodNumber !== undefined ? data.periodNumber : existing.periodNumber;
        const targetStart = data.startTime !== undefined ? data.startTime : existing.startTime;
        const targetEnd = data.endTime !== undefined ? data.endTime : existing.endTime;
        if (targetEnd <= targetStart) {
            throw new CustomError_1.CustomError("endTime must be after startTime", 400);
        }
        if (targetPeriodNumber !== existing.periodNumber) {
            const duplicate = await prismaClient_1.prismaMain.period.findFirst({
                where: {
                    periodNumber: targetPeriodNumber,
                    NOT: { id },
                    deletedAt: null,
                },
            });
            if (duplicate) {
                throw new CustomError_1.CustomError("A period with this period number already exists", 409);
            }
        }
        await assertNoOverlap(targetStart, targetEnd, id);
        try {
            const updated = await prismaClient_1.prismaMain.period.update({
                where: { id },
                data: {
                    ...data,
                    updatedBy: userId,
                },
                include: {
                    sessions: true,
                },
            });
            return updated;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A period with this period number already exists", 409);
            }
            throw error;
        }
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.period.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Period not found", 404);
        }
        await prismaClient_1.prismaMain.period.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
};
