"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const queryFilters_1 = require("@/utils/queryFilters");
const prismaClient_1 = require("@/lib/prismaClient");
const CustomError_1 = require("@/errors/CustomError");
const password_1 = require("@/utils/password");
const employee_1 = require("@/utils/employee");
const UNIQUE_MESSAGES = {
    employeeCode: "An employee with this code already exists",
    panNo: "An employee with this PAN number already exists",
    ssfNo: "An employee with this SSF number already exists",
    userId: "This user is already linked to an employee",
    email: "Email is already taken",
    username: "Username is already taken",
};
const SALT_ROUNDS = 10;
async function ensureLinkedUser(params) {
    const { tx, employeeId, currentUserId, role, password, email, username, actorId } = params;
    if (!role && !password)
        return currentUserId ?? undefined;
    if (!role)
        throw new CustomError_1.CustomError("Role is required when creating a login account", 400);
    const normalizedEmail = email?.trim().toLowerCase();
    if (currentUserId) {
        const user = await tx.user.findFirst({ where: { id: currentUserId, deletedAt: null } });
        if (!user)
            throw new CustomError_1.CustomError("Linked user not found or has been deleted", 404);
        const data = { role, updatedBy: actorId };
        if (normalizedEmail && normalizedEmail !== user.email) {
            const taken = await tx.user.findFirst({ where: { email: normalizedEmail, NOT: { id: currentUserId } } });
            if (taken)
                throw new CustomError_1.CustomError("Email is already taken", 409);
            data.email = normalizedEmail;
        }
        if (username !== undefined)
            data.username = username || null;
        if (password)
            data.passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
        await tx.user.update({ where: { id: currentUserId }, data });
        return currentUserId;
    }
    if (!password)
        throw new CustomError_1.CustomError("Password is required to create a login account", 400);
    if (!normalizedEmail)
        throw new CustomError_1.CustomError("Email is required to create a login account", 400);
    const existingByEmail = await tx.user.findFirst({ where: { email: normalizedEmail } });
    if (existingByEmail) {
        if (existingByEmail.deletedAt)
            throw new CustomError_1.CustomError("Email is already taken", 409);
        if (employeeId) {
            const linked = await tx.employee.findFirst({ where: { userId: existingByEmail.id, deletedAt: null, NOT: { id: employeeId } } });
            if (linked)
                throw new CustomError_1.CustomError("This user is already linked to another employee", 409);
        }
        const data = { role, updatedBy: actorId, failedLoginCount: 0, lockedUntil: null };
        if (username !== undefined)
            data.username = username || null;
        if (password)
            data.passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
        await tx.user.update({ where: { id: existingByEmail.id }, data });
        return existingByEmail.id;
    }
    const passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
    const user = await tx.user.create({
        data: {
            email: normalizedEmail,
            username: username || null,
            passwordHash,
            role,
            isActive: true,
            createdBy: actorId,
        },
    });
    return user.id;
}
const serializeEmployee = (employee) => ({
    ...employee,
    role: employee.role ?? employee.user?.role ?? null,
    email: employee.email ?? employee.user?.email ?? null,
    // DECISIONS.md Feature 2: last 4 only, never the full number in responses.
    bankAccountNo: (0, password_1.maskBankAccountNo)(employee.bankAccountNo ?? null),
});
exports.EmployeeService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = {
            deletedAt: null,
        };
        if (query.search) {
            whereClause.OR = [
                { firstName: { contains: query.search, mode: "insensitive" } },
                { lastName: { contains: query.search, mode: "insensitive" } },
                { employeeCode: { contains: query.search, mode: "insensitive" } },
                { email: { contains: query.search, mode: "insensitive" } },
            ];
        }
        if (query.isActive !== undefined) {
            whereClause.isActive = query.isActive;
        }
        const [employees, total] = await Promise.all([
            prismaClient_1.prismaMain.employee.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                include: {
                    user: { select: { id: true, email: true, username: true, role: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.employee.count({ where: whereClause }),
        ]);
        return {
            employees: employees.map(serializeEmployee),
            pagination: {
                page,
                limit,
                total,
            },
        };
    },
    async create(data, actorId) {
        // Check if userId exists and is not soft-deleted
        if (data.userId) {
            const user = await prismaClient_1.prismaMain.user.findFirst({
                where: { id: data.userId, deletedAt: null },
            });
            if (!user) {
                throw new CustomError_1.CustomError("User not found or has been deleted", 404);
            }
        }
        // Check duplicate employeeCode (only when client supplied one; otherwise auto EMP-XXXX)
        if (data.employeeCode) {
            const existingCode = await prismaClient_1.prismaMain.employee.findFirst({
                where: { employeeCode: data.employeeCode, deletedAt: null },
            });
            if (existingCode) {
                throw new CustomError_1.CustomError("An employee with this code already exists", 409);
            }
        }
        // Check duplicate panNo
        if (data.panNo) {
            const existingPan = await prismaClient_1.prismaMain.employee.findFirst({
                where: { panNo: data.panNo, deletedAt: null },
            });
            if (existingPan) {
                throw new CustomError_1.CustomError("An employee with this PAN number already exists", 409);
            }
        }
        // Check duplicate ssfNo
        if (data.ssfNo) {
            const existingSsf = await prismaClient_1.prismaMain.employee.findFirst({
                where: { ssfNo: data.ssfNo, deletedAt: null },
            });
            if (existingSsf) {
                throw new CustomError_1.CustomError("An employee with this SSF number already exists", 409);
            }
        }
        const { role, password, username, ...employeeData } = data;
        // Create in a transaction; employeeCode EMP-XXXX is generated inside the
        // transaction (sequential max+1). On a unique race, retry once then 409.
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const employee = await prismaClient_1.prismaMain.$transaction(async (tx) => {
                    const linkedUserId = await ensureLinkedUser({
                        tx: tx,
                        currentUserId: employeeData.userId ?? undefined,
                        role,
                        password,
                        email: employeeData.email,
                        username,
                        actorId,
                    });
                    const employeeCode = employeeData.employeeCode ?? (await (0, employee_1.nextEmployeeCode)(tx));
                    return tx.employee.create({
                        data: {
                            ...employeeData,
                            employeeCode,
                            userId: linkedUserId ?? employeeData.userId ?? null,
                            createdBy: actorId,
                        },
                        include: {
                            user: { select: { id: true, email: true, username: true, role: true } },
                        },
                    });
                });
                return serializeEmployee(employee);
            }
            catch (error) {
                const friendly = (0, employee_1.friendlyUniqueError)(error, UNIQUE_MESSAGES);
                if (friendly) {
                    if (attempt === 0 && !data.employeeCode)
                        continue; // auto-code race: recompute once
                    throw friendly;
                }
                throw error;
            }
        }
        throw new CustomError_1.CustomError("Could not allocate an employee code, please retry", 409);
    },
    async getById(id) {
        const employee = await prismaClient_1.prismaMain.employee.findFirst({
            where: { id, deletedAt: null },
            include: {
                user: { select: { id: true, email: true, username: true, role: true } },
                principal: true,
                teacher: true,
                accountant: true,
                staff: true,
            },
        });
        if (!employee) {
            throw new CustomError_1.CustomError("Employee not found", 404);
        }
        return serializeEmployee(employee);
    },
    async update(id, data, actorId) {
        const employee = await prismaClient_1.prismaMain.employee.findFirst({
            where: { id, deletedAt: null },
            select: { id: true, userId: true, employeeCode: true, panNo: true, ssfNo: true, email: true },
        });
        if (!employee) {
            throw new CustomError_1.CustomError("Employee not found", 404);
        }
        // Check if userId exists
        if (data.userId) {
            const user = await prismaClient_1.prismaMain.user.findFirst({
                where: { id: data.userId, deletedAt: null },
            });
            if (!user) {
                throw new CustomError_1.CustomError("User not found or has been deleted", 404);
            }
        }
        // Check duplicate employeeCode
        if (data.employeeCode && data.employeeCode !== employee.employeeCode) {
            const duplicate = await prismaClient_1.prismaMain.employee.findFirst({
                where: {
                    employeeCode: data.employeeCode,
                    NOT: { id },
                    deletedAt: null,
                },
            });
            if (duplicate) {
                throw new CustomError_1.CustomError("An employee with this code already exists", 409);
            }
        }
        // Check duplicate panNo
        if (data.panNo && data.panNo !== employee.panNo) {
            const duplicate = await prismaClient_1.prismaMain.employee.findFirst({
                where: {
                    panNo: data.panNo,
                    NOT: { id },
                    deletedAt: null,
                },
            });
            if (duplicate) {
                throw new CustomError_1.CustomError("An employee with this PAN number already exists", 409);
            }
        }
        // Check duplicate ssfNo
        if (data.ssfNo && data.ssfNo !== employee.ssfNo) {
            const duplicate = await prismaClient_1.prismaMain.employee.findFirst({
                where: {
                    ssfNo: data.ssfNo,
                    NOT: { id },
                    deletedAt: null,
                },
            });
            if (duplicate) {
                throw new CustomError_1.CustomError("An employee with this SSF number already exists", 409);
            }
        }
        const { role, password, username, ...employeeData } = data;
        try {
            const updated = await prismaClient_1.prismaMain.$transaction(async (tx) => {
                const linkedUserId = await ensureLinkedUser({
                    tx: tx,
                    employeeId: id,
                    currentUserId: data.userId ?? employee.userId,
                    role,
                    password,
                    email: employeeData.email ?? employee.email,
                    username,
                    actorId,
                });
                // Single role profile: requested role must match any existing profile.
                await (0, employee_1.assertEmployeeRoleCompatible)(tx, id, role, linkedUserId ?? data.userId ?? employee.userId);
                const result = await tx.employee.update({
                    where: { id },
                    data: {
                        ...employeeData,
                        ...(linkedUserId ? { userId: linkedUserId } : {}),
                        updatedBy: actorId,
                    },
                    include: {
                        user: { select: { id: true, email: true, username: true, role: true } },
                    },
                });
                // Deactivating an employee disables the linked login account (and
                // reactivating re-enables it), in the same transaction.
                if (employeeData.isActive !== undefined) {
                    const targetUserId = linkedUserId ?? employee.userId;
                    if (targetUserId) {
                        await tx.user.update({
                            where: { id: targetUserId },
                            data: { isActive: employeeData.isActive, updatedBy: actorId },
                        });
                    }
                }
                return result;
            });
            return serializeEmployee(updated);
        }
        catch (error) {
            const friendly = (0, employee_1.friendlyUniqueError)(error, UNIQUE_MESSAGES);
            if (friendly)
                throw friendly;
            throw error;
        }
    },
    async delete(id, userId) {
        const employee = await prismaClient_1.prismaMain.employee.findFirst({
            where: { id, deletedAt: null },
        });
        if (!employee) {
            throw new CustomError_1.CustomError("Employee not found", 404);
        }
        // Soft-delete + disable linked login account atomically.
        await prismaClient_1.prismaMain.$transaction(async (tx) => {
            await tx.employee.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    updatedBy: userId,
                },
            });
            if (employee.userId) {
                await tx.user.update({
                    where: { id: employee.userId },
                    data: { isActive: false, updatedBy: userId },
                });
            }
        });
        return null;
    },
};
