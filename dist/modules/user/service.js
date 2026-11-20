"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prismaClient_1 = require("@/lib/prismaClient");
const CustomError_1 = require("@/errors/CustomError");
const queryFilters_1 = require("@/utils/queryFilters");
const audit_1 = require("@/lib/audit");
const SALT_ROUNDS = 10;
const USER_SAFE_SELECT = {
    id: true,
    email: true,
    username: true,
    role: true,
    isActive: true,
    isEmailVerified: true,
    lastLoginAt: true,
    failedLoginCount: true,
    lockedUntil: true,
    createdAt: true,
    updatedAt: true,
    createdBy: true,
    updatedBy: true,
    deletedAt: true,
    employee: {
        select: { id: true, employeeCode: true, firstName: true, lastName: true, designation: true },
    },
    student: {
        select: { id: true, firstName: true, lastName: true, universityRegNo: true, batchId: true },
    },
};
async function activeAdminCount(excludeId) {
    return prismaClient_1.prismaMain.user.count({
        where: {
            role: "ADMIN",
            isActive: true,
            deletedAt: null,
            ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
    });
}
async function assertCanChangeAdminState(targetId, actorId, message) {
    if (actorId && targetId === actorId) {
        throw new CustomError_1.CustomError(message ?? "You cannot change your own account state", 409);
    }
    const target = await prismaClient_1.prismaMain.user.findFirst({ where: { id: targetId, deletedAt: null } });
    if (!target)
        throw new CustomError_1.CustomError("User not found", 404);
    if (target.role === "ADMIN" && (await activeAdminCount(targetId)) === 0) {
        throw new CustomError_1.CustomError("This is the last active admin and cannot be changed this way", 409);
    }
    return target;
}
function employeeRoleAllowed(role) {
    return ["TEACHER", "PRINCIPAL", "ACCOUNTANT", "STAFF", "ADMIN"].includes(role);
}
exports.UserService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10, 200);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const take = limit;
        const where = query.includeDeleted ? {} : { deletedAt: null };
        if (query.search) {
            where.OR = [
                { email: { contains: query.search, mode: "insensitive" } },
                { username: { contains: query.search, mode: "insensitive" } },
            ];
        }
        if (query.role)
            where.role = query.role;
        if (query.isActive !== undefined)
            where.isActive = query.isActive;
        if (query.isEmailVerified !== undefined)
            where.isEmailVerified = query.isEmailVerified;
        if (query.isLocked === true)
            where.lockedUntil = { gt: new Date() };
        if (query.isLocked === false) {
            where.OR = [...(where.OR ?? []), { lockedUntil: null }, { lockedUntil: { lte: new Date() } }];
        }
        const [data, total] = await Promise.all([
            prismaClient_1.prismaMain.user.findMany({ where, skip, take, select: USER_SAFE_SELECT, orderBy: { createdAt: "desc" } }),
            prismaClient_1.prismaMain.user.count({ where }),
        ]);
        return { data, pagination: { page, limit, total } };
    },
    async create(data, userId) {
        const [emailTaken, usernameTaken] = await Promise.all([
            prismaClient_1.prismaMain.user.findUnique({ where: { email: data.email } }),
            data.username ? prismaClient_1.prismaMain.user.findUnique({ where: { username: data.username } }) : null,
        ]);
        if (emailTaken)
            throw new CustomError_1.CustomError("A user with this email already exists", 409);
        if (usernameTaken)
            throw new CustomError_1.CustomError("A user with this username already exists", 409);
        const passwordHash = await bcrypt_1.default.hash(data.password, SALT_ROUNDS);
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: data.email,
                    username: data.username ?? null,
                    passwordHash,
                    role: data.role,
                    isActive: data.isActive ?? true,
                    isEmailVerified: data.isEmailVerified ?? false,
                    createdBy: userId,
                },
                select: USER_SAFE_SELECT,
            });
            await (0, audit_1.writeAudit)(tx, { entity: "User", entityId: user.id, action: "CREATE", newValues: { ...user, passwordHash: undefined }, userId });
            return user;
        });
    },
    async getById(id) {
        const user = await prismaClient_1.prismaMain.user.findFirst({ where: { id, deletedAt: null }, select: USER_SAFE_SELECT });
        if (!user)
            throw new CustomError_1.CustomError("User not found", 404);
        return user;
    },
    async update(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.user.findFirst({ where: { id, deletedAt: null } });
        if (!existing)
            throw new CustomError_1.CustomError("User not found", 404);
        if (data.role && data.role !== existing.role) {
            if (!data.reason)
                throw new CustomError_1.CustomError("A reason is required to change a user's role", 400);
            if (userId && id === userId)
                throw new CustomError_1.CustomError("You cannot change your own role", 409);
            if (existing.role === "ADMIN" && data.role !== "ADMIN" && (await activeAdminCount(id)) === 0) {
                throw new CustomError_1.CustomError("Cannot change the role of the last active admin", 409);
            }
        }
        if (data.isActive === false && existing.isActive !== false) {
            if (!data.reason)
                throw new CustomError_1.CustomError("A reason is required to deactivate a user", 400);
            await assertCanChangeAdminState(id, userId, "You cannot deactivate your own account");
        }
        if (data.isEmailVerified === true && !existing.isEmailVerified && !data.reason) {
            throw new CustomError_1.CustomError("A reason is required to manually verify an email", 400);
        }
        if (data.email && data.email !== existing.email) {
            const taken = await prismaClient_1.prismaMain.user.findUnique({ where: { email: data.email } });
            if (taken)
                throw new CustomError_1.CustomError("A user with this email already exists", 409);
        }
        if (data.username !== undefined && data.username !== existing.username && data.username) {
            const taken = await prismaClient_1.prismaMain.user.findUnique({ where: { username: data.username } });
            if (taken)
                throw new CustomError_1.CustomError("A user with this username already exists", 409);
        }
        const { reason, ...updateData } = data;
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            const user = await tx.user.update({ where: { id }, data: { ...updateData, updatedBy: userId }, select: USER_SAFE_SELECT });
            if (data.role && data.role !== existing.role) {
                await (0, audit_1.writeAudit)(tx, {
                    entity: "User",
                    entityId: id,
                    action: "ROLE_CHANGE",
                    oldValues: { role: existing.role },
                    newValues: { role: data.role, reason },
                    userId,
                });
            }
            if (data.isActive !== undefined && data.isActive !== existing.isActive) {
                await (0, audit_1.writeAudit)(tx, {
                    entity: "User",
                    entityId: id,
                    action: data.isActive ? "ACTIVATE" : "DEACTIVATE",
                    oldValues: { isActive: existing.isActive },
                    newValues: { isActive: data.isActive, reason },
                    userId,
                });
            }
            if (data.isEmailVerified === true && !existing.isEmailVerified) {
                await (0, audit_1.writeAudit)(tx, {
                    entity: "User",
                    entityId: id,
                    action: "EMAIL_VERIFIED",
                    newValues: { isEmailVerified: true, reason },
                    userId,
                });
            }
            return user;
        });
    },
    async resetPassword(id, data, userId) {
        const existing = await prismaClient_1.prismaMain.user.findFirst({ where: { id, deletedAt: null } });
        if (!existing)
            throw new CustomError_1.CustomError("User not found", 404);
        const passwordHash = await bcrypt_1.default.hash(data.password, SALT_ROUNDS);
        await prismaClient_1.prismaMain.$transaction(async (tx) => {
            await tx.user.update({
                where: { id },
                data: { passwordHash, failedLoginCount: 0, lockedUntil: null, updatedBy: userId },
            });
            await (0, audit_1.writeAudit)(tx, {
                entity: "User",
                entityId: id,
                action: "PASSWORD_RESET",
                newValues: { reason: data.reason ?? null },
                userId,
            });
        });
        return null;
    },
    async unlock(id, userId) {
        const existing = await prismaClient_1.prismaMain.user.findFirst({ where: { id, deletedAt: null } });
        if (!existing)
            throw new CustomError_1.CustomError("User not found", 404);
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            const user = await tx.user.update({
                where: { id },
                data: { failedLoginCount: 0, lockedUntil: null, updatedBy: userId },
                select: USER_SAFE_SELECT,
            });
            await (0, audit_1.writeAudit)(tx, { entity: "User", entityId: id, action: "UNLOCK", oldValues: { lockedUntil: existing.lockedUntil }, userId });
            return user;
        });
    },
    async linkPerson(userId, input, actorId) {
        const user = await prismaClient_1.prismaMain.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { employee: { select: { id: true } }, student: { select: { id: true } } },
        });
        if (!user)
            throw new CustomError_1.CustomError("User not found", 404);
        if (user.employee || user.student) {
            throw new CustomError_1.CustomError("User is already linked to a person; unlink first", 409);
        }
        if (input.type === "employee") {
            if (!employeeRoleAllowed(user.role))
                throw new CustomError_1.CustomError(`Role ${user.role} cannot be linked to an employee`, 409);
            const employee = await prismaClient_1.prismaMain.employee.findFirst({ where: { id: input.id, deletedAt: null } });
            if (!employee)
                throw new CustomError_1.CustomError("Employee not found", 404);
            if (employee.userId)
                throw new CustomError_1.CustomError("Employee is already linked to another user", 409);
            return prismaClient_1.prismaMain.$transaction(async (tx) => {
                await tx.employee.update({ where: { id: input.id }, data: { userId, updatedBy: actorId } });
                await (0, audit_1.writeAudit)(tx, { entity: "User", entityId: userId, action: "LINK_EMPLOYEE", newValues: { employeeId: input.id }, userId: actorId });
                return exports.UserService.getById(userId);
            });
        }
        if (user.role !== "STUDENT")
            throw new CustomError_1.CustomError("Only STUDENT users can be linked to a student record", 409);
        const student = await prismaClient_1.prismaMain.student.findFirst({ where: { id: input.id, deletedAt: null } });
        if (!student)
            throw new CustomError_1.CustomError("Student not found", 404);
        if (student.userId)
            throw new CustomError_1.CustomError("Student is already linked to another user", 409);
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            await tx.student.update({ where: { id: input.id }, data: { userId, updatedBy: actorId } });
            await (0, audit_1.writeAudit)(tx, { entity: "User", entityId: userId, action: "LINK_STUDENT", newValues: { studentId: input.id }, userId: actorId });
            return exports.UserService.getById(userId);
        });
    },
    async unlinkPerson(userId, actorId) {
        const user = await prismaClient_1.prismaMain.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { employee: { select: { id: true } }, student: { select: { id: true } } },
        });
        if (!user)
            throw new CustomError_1.CustomError("User not found", 404);
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            if (user.employee)
                await tx.employee.update({ where: { id: user.employee.id }, data: { userId: null, updatedBy: actorId } });
            if (user.student)
                await tx.student.update({ where: { id: user.student.id }, data: { userId: null, updatedBy: actorId } });
            await (0, audit_1.writeAudit)(tx, { entity: "User", entityId: userId, action: "UNLINK_PERSON", userId: actorId });
            return exports.UserService.getById(userId);
        });
    },
    async verifyEmail(id, reason, actorId) {
        if (!reason?.trim())
            throw new CustomError_1.CustomError("A reason is required to manually verify an email", 400);
        const existing = await prismaClient_1.prismaMain.user.findFirst({ where: { id, deletedAt: null } });
        if (!existing)
            throw new CustomError_1.CustomError("User not found", 404);
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            const user = await tx.user.update({ where: { id }, data: { isEmailVerified: true, updatedBy: actorId }, select: USER_SAFE_SELECT });
            await (0, audit_1.writeAudit)(tx, { entity: "User", entityId: id, action: "EMAIL_VERIFIED", newValues: { reason: reason.trim() }, userId: actorId });
            return user;
        });
    },
    async restore(id, actorId) {
        const existing = await prismaClient_1.prismaMain.user.findUnique({ where: { id } });
        if (!existing)
            throw new CustomError_1.CustomError("User not found", 404);
        if (!existing.deletedAt)
            throw new CustomError_1.CustomError("User is not deleted", 409);
        return prismaClient_1.prismaMain.$transaction(async (tx) => {
            const user = await tx.user.update({ where: { id }, data: { deletedAt: null, updatedBy: actorId }, select: USER_SAFE_SELECT });
            await (0, audit_1.writeAudit)(tx, { entity: "User", entityId: id, action: "RESTORE", userId: actorId });
            return user;
        });
    },
    async delete(id, userId) {
        await assertCanChangeAdminState(id, userId, "You cannot delete your own account");
        const existing = await prismaClient_1.prismaMain.user.findFirst({
            where: { id, deletedAt: null },
            include: { employee: { select: { id: true } }, student: { select: { id: true } } },
        });
        if (!existing)
            throw new CustomError_1.CustomError("User not found", 404);
        if (existing.employee || existing.student) {
            throw new CustomError_1.CustomError("User is linked to a person record; unlink or deactivate instead", 409);
        }
        await prismaClient_1.prismaMain.$transaction(async (tx) => {
            await tx.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false, updatedBy: userId } });
            await (0, audit_1.writeAudit)(tx, { entity: "User", entityId: id, action: "DELETE", oldValues: { email: existing.email, role: existing.role }, userId });
        });
        return null;
    },
};
