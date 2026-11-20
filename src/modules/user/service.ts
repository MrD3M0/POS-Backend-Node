import bcrypt from "bcrypt";
import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { calculateSkipAndTake, resolvePageLimit } from "@/utils/queryFilters";
import { writeAudit } from "@/lib/audit";
import {
  UserCreateInput,
  UserLinkPersonInput,
  UserResetPasswordInput,
  UserUpdateInput,
} from "./validator";

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
} as const;

async function activeAdminCount(excludeId?: string) {
  return prismaMain.user.count({
    where: {
      role: "ADMIN",
      isActive: true,
      deletedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
}

async function assertCanChangeAdminState(targetId: string, actorId?: string, message?: string) {
  if (actorId && targetId === actorId) {
    throw new CustomError(message ?? "You cannot change your own account state", 409);
  }
  const target = await prismaMain.user.findFirst({ where: { id: targetId, deletedAt: null } });
  if (!target) throw new CustomError("User not found", 404);
  if (target.role === "ADMIN" && (await activeAdminCount(targetId)) === 0) {
    throw new CustomError("This is the last active admin and cannot be changed this way", 409);
  }
  return target;
}

function employeeRoleAllowed(role: string) {
  return ["TEACHER", "PRINCIPAL", "ACCOUNTANT", "STAFF", "ADMIN"].includes(role);
}

export const UserService = {
  async index(query: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
    isLocked?: boolean;
    isEmailVerified?: boolean;
    includeDeleted?: boolean;
  }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10, 200);
    const skip = limit === -1 ? 0 : (page - 1) * limit;
    const take = limit;

    const where: Record<string, unknown> = query.includeDeleted ? {} : { deletedAt: null };
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: "insensitive" } },
        { username: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.role) where.role = query.role;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.isEmailVerified !== undefined) where.isEmailVerified = query.isEmailVerified;
    if (query.isLocked === true) where.lockedUntil = { gt: new Date() };
    if (query.isLocked === false) {
      where.OR = [...((where.OR as unknown[]) ?? []), { lockedUntil: null }, { lockedUntil: { lte: new Date() } }];
    }

    const [data, total] = await Promise.all([
      prismaMain.user.findMany({ where, skip, take, select: USER_SAFE_SELECT, orderBy: { createdAt: "desc" } }),
      prismaMain.user.count({ where }),
    ]);

    return { data, pagination: { page, limit, total } };
  },

  async create(data: UserCreateInput, userId?: string) {
    const [emailTaken, usernameTaken] = await Promise.all([
      prismaMain.user.findUnique({ where: { email: data.email } }),
      data.username ? prismaMain.user.findUnique({ where: { username: data.username } }) : null,
    ]);
    if (emailTaken) throw new CustomError("A user with this email already exists", 409);
    if (usernameTaken) throw new CustomError("A user with this username already exists", 409);

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    return prismaMain.$transaction(async (tx) => {
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
      await writeAudit(tx, { entity: "User", entityId: user.id, action: "CREATE", newValues: { ...user, passwordHash: undefined }, userId });
      return user;
    });
  },

  async getById(id: string) {
    const user = await prismaMain.user.findFirst({ where: { id, deletedAt: null }, select: USER_SAFE_SELECT });
    if (!user) throw new CustomError("User not found", 404);
    return user;
  },

  async update(id: string, data: UserUpdateInput, userId?: string) {
    const existing = await prismaMain.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new CustomError("User not found", 404);

    if (data.role && data.role !== existing.role) {
      if (!data.reason) throw new CustomError("A reason is required to change a user's role", 400);
      if (userId && id === userId) throw new CustomError("You cannot change your own role", 409);
      if (existing.role === "ADMIN" && data.role !== "ADMIN" && (await activeAdminCount(id)) === 0) {
        throw new CustomError("Cannot change the role of the last active admin", 409);
      }
    }

    if (data.isActive === false && existing.isActive !== false) {
      if (!data.reason) throw new CustomError("A reason is required to deactivate a user", 400);
      await assertCanChangeAdminState(id, userId, "You cannot deactivate your own account");
    }

    if (data.isEmailVerified === true && !existing.isEmailVerified && !data.reason) {
      throw new CustomError("A reason is required to manually verify an email", 400);
    }

    if (data.email && data.email !== existing.email) {
      const taken = await prismaMain.user.findUnique({ where: { email: data.email } });
      if (taken) throw new CustomError("A user with this email already exists", 409);
    }
    if (data.username !== undefined && data.username !== existing.username && data.username) {
      const taken = await prismaMain.user.findUnique({ where: { username: data.username } });
      if (taken) throw new CustomError("A user with this username already exists", 409);
    }

    const { reason, ...updateData } = data;

    return prismaMain.$transaction(async (tx) => {
      const user = await tx.user.update({ where: { id }, data: { ...updateData, updatedBy: userId }, select: USER_SAFE_SELECT });
      if (data.role && data.role !== existing.role) {
        await writeAudit(tx, {
          entity: "User",
          entityId: id,
          action: "ROLE_CHANGE",
          oldValues: { role: existing.role },
          newValues: { role: data.role, reason },
          userId,
        });
      }
      if (data.isActive !== undefined && data.isActive !== existing.isActive) {
        await writeAudit(tx, {
          entity: "User",
          entityId: id,
          action: data.isActive ? "ACTIVATE" : "DEACTIVATE",
          oldValues: { isActive: existing.isActive },
          newValues: { isActive: data.isActive, reason },
          userId,
        });
      }
      if (data.isEmailVerified === true && !existing.isEmailVerified) {
        await writeAudit(tx, {
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

  async resetPassword(id: string, data: UserResetPasswordInput, userId?: string) {
    const existing = await prismaMain.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new CustomError("User not found", 404);

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    await prismaMain.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { passwordHash, failedLoginCount: 0, lockedUntil: null, updatedBy: userId },
      });
      await writeAudit(tx, {
        entity: "User",
        entityId: id,
        action: "PASSWORD_RESET",
        newValues: { reason: data.reason ?? null },
        userId,
      });
    });
    return null;
  },

  async unlock(id: string, userId?: string) {
    const existing = await prismaMain.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new CustomError("User not found", 404);

    return prismaMain.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: { failedLoginCount: 0, lockedUntil: null, updatedBy: userId },
        select: USER_SAFE_SELECT,
      });
      await writeAudit(tx, { entity: "User", entityId: id, action: "UNLOCK", oldValues: { lockedUntil: existing.lockedUntil }, userId });
      return user;
    });
  },

  async linkPerson(userId: string, input: UserLinkPersonInput, actorId?: string) {
    const user = await prismaMain.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { employee: { select: { id: true } }, student: { select: { id: true } } },
    });
    if (!user) throw new CustomError("User not found", 404);
    if (user.employee || user.student) {
      throw new CustomError("User is already linked to a person; unlink first", 409);
    }

    if (input.type === "employee") {
      if (!employeeRoleAllowed(user.role)) throw new CustomError(`Role ${user.role} cannot be linked to an employee`, 409);
      const employee = await prismaMain.employee.findFirst({ where: { id: input.id, deletedAt: null } });
      if (!employee) throw new CustomError("Employee not found", 404);
      if (employee.userId) throw new CustomError("Employee is already linked to another user", 409);
      return prismaMain.$transaction(async (tx) => {
        await tx.employee.update({ where: { id: input.id }, data: { userId, updatedBy: actorId } });
        await writeAudit(tx, { entity: "User", entityId: userId, action: "LINK_EMPLOYEE", newValues: { employeeId: input.id }, userId: actorId });
        return UserService.getById(userId);
      });
    }

    if (user.role !== "STUDENT") throw new CustomError("Only STUDENT users can be linked to a student record", 409);
    const student = await prismaMain.student.findFirst({ where: { id: input.id, deletedAt: null } });
    if (!student) throw new CustomError("Student not found", 404);
    if (student.userId) throw new CustomError("Student is already linked to another user", 409);
    return prismaMain.$transaction(async (tx) => {
      await tx.student.update({ where: { id: input.id }, data: { userId, updatedBy: actorId } });
      await writeAudit(tx, { entity: "User", entityId: userId, action: "LINK_STUDENT", newValues: { studentId: input.id }, userId: actorId });
      return UserService.getById(userId);
    });
  },

  async unlinkPerson(userId: string, actorId?: string) {
    const user = await prismaMain.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { employee: { select: { id: true } }, student: { select: { id: true } } },
    });
    if (!user) throw new CustomError("User not found", 404);

    return prismaMain.$transaction(async (tx) => {
      if (user.employee) await tx.employee.update({ where: { id: user.employee.id }, data: { userId: null, updatedBy: actorId } });
      if (user.student) await tx.student.update({ where: { id: user.student.id }, data: { userId: null, updatedBy: actorId } });
      await writeAudit(tx, { entity: "User", entityId: userId, action: "UNLINK_PERSON", userId: actorId });
      return UserService.getById(userId);
    });
  },

  async verifyEmail(id: string, reason: string, actorId?: string) {
    if (!reason?.trim()) throw new CustomError("A reason is required to manually verify an email", 400);
    const existing = await prismaMain.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new CustomError("User not found", 404);

    return prismaMain.$transaction(async (tx) => {
      const user = await tx.user.update({ where: { id }, data: { isEmailVerified: true, updatedBy: actorId }, select: USER_SAFE_SELECT });
      await writeAudit(tx, { entity: "User", entityId: id, action: "EMAIL_VERIFIED", newValues: { reason: reason.trim() }, userId: actorId });
      return user;
    });
  },

  async restore(id: string, actorId?: string) {
    const existing = await prismaMain.user.findUnique({ where: { id } });
    if (!existing) throw new CustomError("User not found", 404);
    if (!existing.deletedAt) throw new CustomError("User is not deleted", 409);

    return prismaMain.$transaction(async (tx) => {
      const user = await tx.user.update({ where: { id }, data: { deletedAt: null, updatedBy: actorId }, select: USER_SAFE_SELECT });
      await writeAudit(tx, { entity: "User", entityId: id, action: "RESTORE", userId: actorId });
      return user;
    });
  },

  async delete(id: string, userId?: string) {
    await assertCanChangeAdminState(id, userId, "You cannot delete your own account");
    const existing = await prismaMain.user.findFirst({
      where: { id, deletedAt: null },
      include: { employee: { select: { id: true } }, student: { select: { id: true } } },
    });
    if (!existing) throw new CustomError("User not found", 404);
    if (existing.employee || existing.student) {
      throw new CustomError("User is linked to a person record; unlink or deactivate instead", 409);
    }

    await prismaMain.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false, updatedBy: userId } });
      await writeAudit(tx, { entity: "User", entityId: id, action: "DELETE", oldValues: { email: existing.email, role: existing.role }, userId });
    });
    return null;
  },
};
