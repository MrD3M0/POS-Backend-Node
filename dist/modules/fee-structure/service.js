"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeStructureService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
const safe_select_1 = require("@/utils/safe-select");
const money_1 = require("@/lib/money");
exports.FeeStructureService = {
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
        const [structures, total] = await Promise.all([
            prismaClient_1.prismaMain.feeStructure.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    items: { include: { feeHead: true } },
                    course: { select: safe_select_1.COURSE_SAFE_SELECT },
                    batch: { select: safe_select_1.BATCH_SAFE_SELECT },
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.feeStructure.count({ where: whereClause }),
        ]);
        return {
            data: structures,
            pagination: { page, limit, total },
        };
    },
    /**
     * Creates a fee structure. With batchId set, it is the override for that
     * batch; without it, it is the course-wide default. The batch must belong
     * to the given course. Items can be created nested in one call.
     */
    async create(data, userId) {
        const course = await prismaClient_1.prismaMain.course.findFirst({
            where: { id: data.courseId, deletedAt: null },
            select: { id: true, name: true },
        });
        if (!course) {
            throw new CustomError_1.CustomError("Course not found", 404);
        }
        if (data.batchId) {
            const batch = await prismaClient_1.prismaMain.batch.findFirst({
                where: { id: data.batchId, deletedAt: null },
                select: { id: true, courseId: true, name: true },
            });
            if (!batch) {
                throw new CustomError_1.CustomError("Batch not found", 404);
            }
            if (batch.courseId !== data.courseId) {
                throw new CustomError_1.CustomError("Batch does not belong to the given course", 400);
            }
        }
        if (data.items && data.items.length > 0) {
            const seen = new Set();
            for (const item of data.items) {
                const key = `${item.feeHeadId}::${item.termNumber ?? "once"}`;
                if (seen.has(key)) {
                    throw new CustomError_1.CustomError("Items must not repeat the same fee head and term", 400);
                }
                seen.add(key);
            }
            const heads = await prismaClient_1.prismaMain.feeHead.findMany({
                where: {
                    id: { in: [...new Set(data.items.map((item) => item.feeHeadId))] },
                    deletedAt: null,
                },
            });
            if (heads.length !== new Set(data.items.map((item) => item.feeHeadId)).size) {
                throw new CustomError_1.CustomError("One or more fee heads not found", 404);
            }
            if (heads.some((head) => !head.isActive)) {
                throw new CustomError_1.CustomError("One or more fee heads are inactive", 400);
            }
        }
        try {
            const structure = await prismaClient_1.prismaMain.feeStructure.create({
                data: {
                    courseId: data.courseId,
                    batchId: data.batchId ?? null,
                    name: data.name,
                    isActive: data.isActive ?? true,
                    ...(userId && { createdBy: userId }),
                    ...(data.items && data.items.length > 0
                        ? {
                            items: {
                                create: data.items.map((item) => ({
                                    feeHeadId: item.feeHeadId,
                                    termNumber: item.termNumber ?? null,
                                    amount: (0, money_1.dec)(item.amount, "item amount"),
                                    ...(userId && { createdBy: userId }),
                                })),
                            },
                        }
                        : {}),
                },
                include: {
                    items: { include: { feeHead: true } },
                    course: { select: safe_select_1.COURSE_SAFE_SELECT },
                    batch: { select: safe_select_1.BATCH_SAFE_SELECT },
                },
            });
            return structure;
        }
        catch (error) {
            if (error?.code === "P2002") {
                throw new CustomError_1.CustomError("A fee structure item for this head and term already exists", 409);
            }
            throw error;
        }
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.feeStructure.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Fee structure not found", 404);
        }
        const courseId = data.courseId ?? existing.courseId;
        const course = await prismaClient_1.prismaMain.course.findFirst({
            where: { id: courseId, deletedAt: null },
            select: { id: true, name: true },
        });
        if (!course)
            throw new CustomError_1.CustomError("Course not found", 404);
        const batchId = data.batchId !== undefined ? data.batchId : existing.batchId;
        if (batchId) {
            const batch = await prismaClient_1.prismaMain.batch.findFirst({
                where: { id: batchId, deletedAt: null },
                select: { id: true, courseId: true, name: true },
            });
            if (!batch)
                throw new CustomError_1.CustomError("Batch not found", 404);
            if (batch.courseId !== courseId) {
                throw new CustomError_1.CustomError("Batch does not belong to the given course", 400);
            }
        }
        if (data.items) {
            const seen = new Set();
            for (const item of data.items) {
                const key = `${item.feeHeadId}::${item.termNumber ?? "once"}`;
                if (seen.has(key)) {
                    throw new CustomError_1.CustomError("Items must not repeat the same fee head and term", 400);
                }
                seen.add(key);
            }
            const headIds = [...new Set(data.items.map((item) => item.feeHeadId))];
            const heads = await prismaClient_1.prismaMain.feeHead.findMany({
                where: { id: { in: headIds }, deletedAt: null },
            });
            if (heads.length !== headIds.length) {
                throw new CustomError_1.CustomError("One or more fee heads not found", 404);
            }
            if (heads.some((head) => !head.isActive)) {
                throw new CustomError_1.CustomError("One or more fee heads are inactive", 400);
            }
        }
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            if (data.items) {
                // The old rows are replaced; students that already got this structure
                // keep their own copy of the items.
                await tx.feeStructureItem.deleteMany({
                    where: { feeStructureId: id, deletedAt: null },
                });
                if (data.items.length > 0) {
                    await tx.feeStructureItem.createMany({
                        data: data.items.map((item) => ({
                            feeStructureId: id,
                            feeHeadId: item.feeHeadId,
                            termNumber: item.termNumber ?? null,
                            amount: (0, money_1.dec)(item.amount, "item amount"),
                            createdBy: userId ?? null,
                            updatedBy: userId ?? null,
                        })),
                    });
                }
            }
            const structure = await tx.feeStructure.update({
                where: { id },
                data: {
                    ...(data.name !== undefined ? { name: data.name.trim() } : {}),
                    ...(data.courseId !== undefined ? { courseId } : {}),
                    ...(data.batchId !== undefined ? { batchId: batchId ?? null } : {}),
                    ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
                    updatedBy: userId ?? null,
                },
                include: { items: { include: { feeHead: true } } },
            });
            return structure;
        });
    },
    async getById(id) {
        const structure = await prismaClient_1.prismaMain.feeStructure.findFirst({
            where: { id, deletedAt: null },
            include: {
                items: { include: { feeHead: true } },
                course: { select: safe_select_1.COURSE_SAFE_SELECT },
                batch: { select: safe_select_1.BATCH_SAFE_SELECT },
            },
        });
        if (!structure) {
            throw new CustomError_1.CustomError("Fee structure not found", 404);
        }
        return structure;
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.feeStructure.findFirst({
            where: { id, deletedAt: null },
            include: {
                _count: { select: { studentFees: true } },
            },
        });
        if (!existing) {
            throw new CustomError_1.CustomError("Fee structure not found", 404);
        }
        if (existing._count.studentFees > 0) {
            throw new CustomError_1.CustomError("Fee structure is assigned to students and cannot be deleted", 409);
        }
        await prismaClient_1.prismaMain.feeStructure.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
        return null;
    },
};
