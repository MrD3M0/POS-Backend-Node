"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuardianService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
exports.GuardianService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {
            deletedAt: null,
        };
        if (query.search) {
            whereClause.OR = [
                { fullName: { contains: query.search, mode: "insensitive" } },
                { phone: { contains: query.search, mode: "insensitive" } },
                { email: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [guardians, total] = await Promise.all([
            prismaClient_1.prismaMain.guardian.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    student: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.guardian.count({ where: whereClause }),
        ]);
        return {
            data: guardians,
            pagination: { page, limit, total },
        };
    },
    async create(data, userId) {
        // Exactly-one-primary invariant (F4): a student has exactly one
        // primary guardian. Making a new guardian primary demotes the old
        // one in the same transaction; the first guardian must be primary.
        try {
            const guardian = await prismaClient_1.prismaMain.$transaction(async (tx) => {
                const student = await tx.student.findFirst({
                    where: { id: data.studentId, deletedAt: null },
                    select: { id: true },
                });
                if (!student) {
                    throw new CustomError_1.CustomError("Student not found or has been deleted", 404);
                }
                const existingPrimary = await tx.guardian.findFirst({
                    where: {
                        studentId: data.studentId,
                        isPrimary: true,
                        deletedAt: null,
                    },
                    select: { id: true },
                });
                const isPrimary = data.isPrimary === true;
                if (!isPrimary && !existingPrimary) {
                    throw new CustomError_1.CustomError("A student must have exactly one primary guardian; mark this guardian isPrimary", 400);
                }
                if (isPrimary && existingPrimary) {
                    await tx.guardian.updateMany({
                        where: {
                            studentId: data.studentId,
                            isPrimary: true,
                            deletedAt: null,
                        },
                        data: { isPrimary: false, updatedBy: userId },
                    });
                }
                return tx.guardian.create({
                    data: {
                        ...data,
                        isPrimary,
                        ...(userId && { createdBy: userId }),
                    },
                    include: {
                        student: true,
                    },
                });
            });
            return guardian;
        }
        catch (error) {
            if (error instanceof CustomError_1.CustomError)
                throw error;
            if (error.code === "P2002") {
                throw new CustomError_1.CustomError("A guardian with this student and relation already exists", 409);
            }
            throw error;
        }
    },
    async getById(id) {
        const guardian = await prismaClient_1.prismaMain.guardian.findFirst({
            where: { id, deletedAt: null },
            include: {
                student: true,
            },
        });
        if (!guardian) {
            throw new CustomError_1.CustomError("Guardian not found", 404);
        }
        return guardian;
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.guardian.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Guardian not found", 404);
        }
        // Do not delete the primary guardian while other guardians remain:
        // that would leave the student without exactly one primary.
        if (existing.isPrimary) {
            const others = await prismaClient_1.prismaMain.guardian.count({
                where: { studentId: existing.studentId, deletedAt: null, NOT: { id } },
            });
            if (others > 0) {
                throw new CustomError_1.CustomError("The primary guardian cannot be deleted while other guardians remain; assign a new primary guardian first", 409);
            }
        }
        await prismaClient_1.prismaMain.guardian.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
};
