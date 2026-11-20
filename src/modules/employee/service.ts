import bcrypt from "bcrypt";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { EmployeeCreateInput, EmployeeUpdateInput } from "./validator";
import { maskBankAccountNo } from "@/utils/password";
import { assertEmployeeRoleCompatible, friendlyUniqueError, nextEmployeeCode } from "@/utils/employee";

const UNIQUE_MESSAGES: Record<string, string> = {
  employeeCode: "An employee with this code already exists",
  panNo: "An employee with this PAN number already exists",
  ssfNo: "An employee with this SSF number already exists",
  userId: "This user is already linked to an employee",
  email: "Email is already taken",
  username: "Username is already taken",
};

const SALT_ROUNDS = 10;

async function ensureLinkedUser(params: {
  tx: typeof prismaMain;
  employeeId?: string;
  currentUserId?: string | null;
  role?: EmployeeCreateInput["role"];
  password?: string;
  email?: string | null;
  username?: string | null;
  actorId?: string;
}) {
  const { tx, employeeId, currentUserId, role, password, email, username, actorId } = params;
  if (!role && !password) return currentUserId ?? undefined;
  if (!role) throw new CustomError("Role is required when creating a login account", 400);

  const normalizedEmail = email?.trim().toLowerCase();
  if (currentUserId) {
    const user = await tx.user.findFirst({ where: { id: currentUserId, deletedAt: null } });
    if (!user) throw new CustomError("Linked user not found or has been deleted", 404);
    const data: any = { role, updatedBy: actorId };
    if (normalizedEmail && normalizedEmail !== user.email) {
      const taken = await tx.user.findFirst({ where: { email: normalizedEmail, NOT: { id: currentUserId } } });
      if (taken) throw new CustomError("Email is already taken", 409);
      data.email = normalizedEmail;
    }
    if (username !== undefined) data.username = username || null;
    if (password) data.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await tx.user.update({ where: { id: currentUserId }, data });
    return currentUserId;
  }

  if (!password) throw new CustomError("Password is required to create a login account", 400);
  if (!normalizedEmail) throw new CustomError("Email is required to create a login account", 400);

  const existingByEmail = await tx.user.findFirst({ where: { email: normalizedEmail } });
  if (existingByEmail) {
    if (existingByEmail.deletedAt) throw new CustomError("Email is already taken", 409);
    if (employeeId) {
      const linked = await tx.employee.findFirst({ where: { userId: existingByEmail.id, deletedAt: null, NOT: { id: employeeId } } });
      if (linked) throw new CustomError("This user is already linked to another employee", 409);
    }
    const data: any = { role, updatedBy: actorId, failedLoginCount: 0, lockedUntil: null };
    if (username !== undefined) data.username = username || null;
    if (password) data.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await tx.user.update({ where: { id: existingByEmail.id }, data });
    return existingByEmail.id;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
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

const serializeEmployee = <T extends { user?: { role?: string | null; email?: string | null; username?: string | null } | null; email?: string | null; role?: string | null; bankAccountNo?: string | null }>(
  employee: T,
) => ({
  ...employee,
  role: employee.role ?? employee.user?.role ?? null,
  email: employee.email ?? employee.user?.email ?? null,
  // DECISIONS.md Feature 2: last 4 only, never the full number in responses.
  bankAccountNo: maskBankAccountNo(employee.bankAccountNo ?? null),
});

export const EmployeeService = {
  async index(query: { page?: number; limit?: number; search?: string; isActive?: boolean }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 10);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const whereClause: any = {
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
      prismaMain.employee.findMany({
        where: whereClause,
        skip,
        take: toPrismaTake(limit),
        include: {
          user: { select: { id: true, email: true, username: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.employee.count({ where: whereClause }),
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

  async create(data: EmployeeCreateInput, actorId?: string) {
    // Check if userId exists and is not soft-deleted
    if (data.userId) {
      const user = await prismaMain.user.findFirst({
        where: { id: data.userId, deletedAt: null },
      });
      if (!user) {
        throw new CustomError("User not found or has been deleted", 404);
      }
    }

    // Check duplicate employeeCode (only when client supplied one; otherwise auto EMP-XXXX)
    if (data.employeeCode) {
      const existingCode = await prismaMain.employee.findFirst({
        where: { employeeCode: data.employeeCode, deletedAt: null },
      });

      if (existingCode) {
        throw new CustomError("An employee with this code already exists", 409);
      }
    }

    // Check duplicate panNo
    if (data.panNo) {
      const existingPan = await prismaMain.employee.findFirst({
        where: { panNo: data.panNo, deletedAt: null },
      });
      if (existingPan) {
        throw new CustomError("An employee with this PAN number already exists", 409);
      }
    }

    // Check duplicate ssfNo
    if (data.ssfNo) {
      const existingSsf = await prismaMain.employee.findFirst({
        where: { ssfNo: data.ssfNo, deletedAt: null },
      });
      if (existingSsf) {
        throw new CustomError("An employee with this SSF number already exists", 409);
      }
    }

    const { role, password, username, ...employeeData } = data;

    // Create in a transaction; employeeCode EMP-XXXX is generated inside the
    // transaction (sequential max+1). On a unique race, retry once then 409.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const employee = await prismaMain.$transaction(async (tx) => {
          const linkedUserId = await ensureLinkedUser({
            tx: tx as typeof prismaMain,
            currentUserId: employeeData.userId ?? undefined,
            role,
            password,
            email: employeeData.email,
            username,
            actorId,
          });

          const employeeCode = employeeData.employeeCode ?? (await nextEmployeeCode(tx));

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
      } catch (error: any) {
        const friendly = friendlyUniqueError(error, UNIQUE_MESSAGES);
        if (friendly) {
          if (attempt === 0 && !data.employeeCode) continue; // auto-code race: recompute once
          throw friendly;
        }
        throw error;
      }
    }
    throw new CustomError("Could not allocate an employee code, please retry", 409);
  },

  async getById(id: string) {
    const employee = await prismaMain.employee.findFirst({
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
      throw new CustomError("Employee not found", 404);
    }

    return serializeEmployee(employee);
  },

  async update(id: string, data: EmployeeUpdateInput, actorId?: string) {
    const employee = await prismaMain.employee.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, userId: true, employeeCode: true, panNo: true, ssfNo: true, email: true },
    });

    if (!employee) {
      throw new CustomError("Employee not found", 404);
    }

    // Check if userId exists
    if (data.userId) {
      const user = await prismaMain.user.findFirst({
        where: { id: data.userId, deletedAt: null },
      });
      if (!user) {
        throw new CustomError("User not found or has been deleted", 404);
      }
    }

    // Check duplicate employeeCode
    if (data.employeeCode && data.employeeCode !== employee.employeeCode) {
      const duplicate = await prismaMain.employee.findFirst({
        where: {
          employeeCode: data.employeeCode,
          NOT: { id },
          deletedAt: null,
        },
      });
      if (duplicate) {
        throw new CustomError("An employee with this code already exists", 409);
      }
    }

    // Check duplicate panNo
    if (data.panNo && data.panNo !== employee.panNo) {
      const duplicate = await prismaMain.employee.findFirst({
        where: {
          panNo: data.panNo,
          NOT: { id },
          deletedAt: null,
        },
      });
      if (duplicate) {
        throw new CustomError("An employee with this PAN number already exists", 409);
      }
    }

    // Check duplicate ssfNo
    if (data.ssfNo && data.ssfNo !== employee.ssfNo) {
      const duplicate = await prismaMain.employee.findFirst({
        where: {
          ssfNo: data.ssfNo,
          NOT: { id },
          deletedAt: null,
        },
      });
      if (duplicate) {
        throw new CustomError("An employee with this SSF number already exists", 409);
      }
    }

    const { role, password, username, ...employeeData } = data;

    try {
      const updated = await prismaMain.$transaction(async (tx) => {
        const linkedUserId = await ensureLinkedUser({
          tx: tx as typeof prismaMain,
          employeeId: id,
          currentUserId: data.userId ?? employee.userId,
          role,
          password,
          email: employeeData.email ?? employee.email,
          username,
          actorId,
        });

        // Single role profile: requested role must match any existing profile.
        await assertEmployeeRoleCompatible(tx, id, role, linkedUserId ?? data.userId ?? employee.userId);

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
    } catch (error: any) {
      const friendly = friendlyUniqueError(error, UNIQUE_MESSAGES);
      if (friendly) throw friendly;
      throw error;
    }
  },

  async delete(id: string, userId?: string) {
    const employee = await prismaMain.employee.findFirst({
      where: { id, deletedAt: null },
    });

    if (!employee) {
      throw new CustomError("Employee not found", 404);
    }

    // Soft-delete + disable linked login account atomically.
    await prismaMain.$transaction(async (tx) => {
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