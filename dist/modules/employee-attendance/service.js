"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeAttendanceService = void 0;
// =====================================================================
// Employee attendance — hardened (Feature 9)
// ---------------------------------------------------------------------
//  - dateBs validated against src/utils/bs-date.ts (real BS dates only).
//  - LEAVE requires leaveTypeId; payroll reads LeaveType.isPaid.
//  - Bulk-mark (POST /bulk) upserts by (employeeId, dateBs).
//  - Records lock when payroll is APPROVED/PAID for that BS month and
//    when explicitly isLocked; locked records reject edits/deletes.
//  - Edit window: ATTENDANCE_EDIT_HOURS from Setting (default 24h).
//    Non-ADMIN/PRINCIPAL users cannot edit records older than the
//    window (measured from createdAt); ADMIN/PRINCIPAL bypass.
// =====================================================================
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const employee_1 = require("@/utils/employee");
const CustomError_1 = require("@/errors/CustomError");
const bs_date_1 = require("@/utils/bs-date");
function isDuplicateKeyError(error) {
    const code = error?.code;
    const message = error instanceof Error ? error.message : String(error ?? "");
    return (code === "23505" ||
        code === "P2002" ||
        /duplicate key value violates unique constraint/i.test(message));
}
async function getEditHours(tx) {
    const s = await tx.setting.findUnique({
        where: { key: "ATTENDANCE_EDIT_HOURS" },
    });
    const n = Number(s?.value);
    return Number.isFinite(n) && n > 0 ? n : 24;
}
async function findLockedPayroll(tx, yearBs, monthBs) {
    return tx.payroll.findFirst({
        where: {
            deletedAt: null,
            status: { in: ["APPROVED", "PAID"] },
            yearBs,
            monthBs,
        },
    });
}
async function assertEditable(tx, record, role, action = "edit") {
    if (record.isLocked) {
        throw new CustomError_1.CustomError("This attendance record is locked (payroll approved/paid)", 409);
    }
    const p = (0, bs_date_1.parseBsDate)(record.dateBs);
    if (!p)
        throw new CustomError_1.CustomError(`Invalid attendance date ${record.dateBs}`, 400);
    const { startBs, endBs } = (0, bs_date_1.bsMonthRange)(p.year, p.month);
    const lockedPayroll = await findLockedPayroll(tx, p.year, p.month);
    if (lockedPayroll) {
        throw new CustomError_1.CustomError(`Month ${startBs}..${endBs} is locked (payroll ${lockedPayroll.status})`, 409);
    }
    if (role !== "ADMIN" && role !== "PRINCIPAL") {
        const hours = await getEditHours(tx);
        const ageHours = (Date.now() - new Date(record.createdAt).getTime()) / 3_600_000;
        if (ageHours > hours) {
            throw new CustomError_1.CustomError(`Edit window of ${hours}h has passed for this record`, 409);
        }
    }
}
async function validateRecordRefs(tx, data) {
    const employee = await tx.employee.findFirst({
        where: { id: data.employeeId, deletedAt: null },
    });
    if (!employee)
        throw new CustomError_1.CustomError("Employee not found or has been deleted", 404);
    if (data.status === "LEAVE") {
        if (!data.leaveTypeId)
            throw new CustomError_1.CustomError("leaveTypeId is required for LEAVE", 400);
        const leaveType = await tx.leaveType.findFirst({
            where: { id: data.leaveTypeId, deletedAt: null },
        });
        if (!leaveType)
            throw new CustomError_1.CustomError("Leave type not found or has been deleted", 404);
    }
    else if (data.leaveTypeId) {
        throw new CustomError_1.CustomError("leaveTypeId must be empty unless status is LEAVE", 400);
    }
}
exports.EmployeeAttendanceService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {
            deletedAt: null,
        };
        if (query.status)
            whereClause.status = query.status;
        if (query.employeeId)
            whereClause.employeeId = query.employeeId;
        if (query.dateBs)
            whereClause.dateBs = query.dateBs;
        if (query.yearBs && query.monthBs) {
            const { startBs, endBs } = (0, bs_date_1.bsMonthRange)(query.yearBs, query.monthBs);
            whereClause.dateBs = { gte: startBs, lte: endBs };
        }
        if (query.search) {
            whereClause.OR = [
                {
                    employee: {
                        OR: [
                            { firstName: { contains: query.search, mode: "insensitive" } },
                            { lastName: { contains: query.search, mode: "insensitive" } },
                            { employeeCode: { contains: query.search, mode: "insensitive" } },
                        ],
                    },
                },
                { dateBs: { contains: query.search, mode: "insensitive" } },
                { remarks: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [records, total] = await Promise.all([
            prismaClient_1.prismaMain.employeeAttendance.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    leaveType: true,
                    employee: { select: employee_1.EMPLOYEE_SAFE_SELECT },
                },
                orderBy: [{ dateBs: "desc" }, { createdAt: "desc" }],
            }),
            prismaClient_1.prismaMain.employeeAttendance.count({ where: whereClause }),
        ]);
        return { data: records, pagination: { page, limit, total } };
    },
    async create(data, userId, role) {
        await validateRecordRefs(prismaClient_1.prismaMain, data);
        try {
            return await prismaClient_1.prismaMain.employeeAttendance.create({
                data: {
                    employeeId: data.employeeId,
                    dateBs: data.dateBs,
                    status: data.status,
                    leaveTypeId: data.leaveTypeId ?? null,
                    remarks: data.remarks ?? null,
                    isLocked: role === "ADMIN" || role === "PRINCIPAL"
                        ? Boolean(data.isLocked)
                        : false,
                    createdBy: userId,
                },
                include: { leaveType: true },
            });
        }
        catch (error) {
            if (isDuplicateKeyError(error)) {
                throw new CustomError_1.CustomError("An attendance record for this employee on this date already exists", 409);
            }
            throw error;
        }
    },
    /** Bulk-mark: upsert each (employeeId, dateBs). Locked rows are skipped + reported. */
    async bulkMark(data, userId, role) {
        let created = 0;
        let updated = 0;
        const skipped = [];
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            for (const rec of data.records) {
                await validateRecordRefs(tx, rec);
                const existing = await tx.employeeAttendance.findFirst({
                    where: {
                        employeeId: rec.employeeId,
                        dateBs: rec.dateBs,
                        deletedAt: null,
                    },
                });
                if (existing) {
                    try {
                        await assertEditable(tx, existing, role);
                    }
                    catch (e) {
                        skipped.push({
                            employeeId: rec.employeeId,
                            dateBs: rec.dateBs,
                            reason: e instanceof CustomError_1.CustomError ? e.message : "locked",
                        });
                        continue;
                    }
                    await tx.employeeAttendance.update({
                        where: { id: existing.id },
                        data: {
                            status: rec.status,
                            leaveTypeId: rec.leaveTypeId ?? null,
                            remarks: rec.remarks ?? null,
                            updatedBy: userId,
                        },
                    });
                    updated++;
                }
                else {
                    await tx.employeeAttendance.create({
                        data: {
                            employeeId: rec.employeeId,
                            dateBs: rec.dateBs,
                            status: rec.status,
                            leaveTypeId: rec.leaveTypeId ?? null,
                            remarks: rec.remarks ?? null,
                            createdBy: userId,
                        },
                    });
                    created++;
                }
            }
            return { created, updated, skipped, total: data.records.length };
        });
    },
    async getById(id) {
        const record = await prismaClient_1.prismaMain.employeeAttendance.findFirst({
            where: { id, deletedAt: null },
            include: {
                leaveType: true,
                employee: { select: employee_1.EMPLOYEE_SAFE_SELECT },
            },
        });
        if (!record)
            throw new CustomError_1.CustomError("Employee attendance record not found", 404);
        return record;
    },
    async update(id, data, userId, role) {
        const existing = await prismaClient_1.prismaMain.employeeAttendance.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Employee attendance record not found", 404);
        await assertEditable(prismaClient_1.prismaMain, existing, role);
        const status = data.status ?? existing.status;
        if (data.status === "LEAVE" &&
            !data.leaveTypeId &&
            !existing.leaveTypeId &&
            data.leaveTypeId !== null) {
            throw new CustomError_1.CustomError("leaveTypeId is required when changing status to LEAVE", 400);
        }
        if (data.leaveTypeId) {
            const lt = await prismaClient_1.prismaMain.leaveType.findFirst({
                where: { id: data.leaveTypeId, deletedAt: null },
            });
            if (!lt)
                throw new CustomError_1.CustomError("Leave type not found or has been deleted", 404);
        }
        const patch = {
            updatedBy: userId,
        };
        if (data.status)
            patch.status = data.status;
        if (data.leaveTypeId !== undefined)
            patch.leaveTypeId = data.leaveTypeId;
        if (data.remarks !== undefined)
            patch.remarks = data.remarks;
        if (status !== "LEAVE")
            patch.leaveTypeId = null;
        return prismaClient_1.prismaMain.employeeAttendance.update({
            where: { id },
            data: patch,
            include: { leaveType: true },
        });
    },
    async delete(id, userId, role) {
        const existing = await prismaClient_1.prismaMain.employeeAttendance.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Employee attendance record not found", 404);
        await assertEditable(prismaClient_1.prismaMain, existing, role, "delete");
        await prismaClient_1.prismaMain.employeeAttendance.update({
            where: { id },
            data: { deletedAt: new Date(), updatedBy: userId },
        });
        return null;
    },
};
