import bcrypt from "bcrypt";
import { prismaMain } from "@/lib/prismaClient";
import { CustomError } from "@/errors/CustomError";
import { calculateSkipAndTake } from "@/utils/queryFilters";
import { UserCreateInput, UserUpdateInput } from "@/generated/prisma/models";
import { UserResetPasswordInput } from "./validator";


const SALT_ROUNDS = 10;

// passwordHash must never leave the server
const userSelect = {
  id: true,
  email: true,
  username: true,
  role: true,
  isAdmin: true,
  isActive: true,
  isEmailVerified: true,
  lastLoginAt: true,
  failedLoginCount: true,
  lockedUntil: true,
  createdAt: true,
  updatedAt: true,
  employee: {
    select: { id: true, employeeCode: true, firstName: true, lastName: true },
  },
  student: {
    select: {
      id: true,
      universityRegNo: true,
      firstName: true,
      lastName: true,
    },
  },
};

export const UserService = {
  async index(query: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit ? query.limit : 10;
    const { skip, take } = calculateSkipAndTake(page, limit);

    const whereClause: any = { deletedAt: null };

    if (query.search) {
      whereClause.OR = [
        { email: { contains: query.search, mode: "insensitive" } },
        { username: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.role) whereClause.role = query.role;
    if (query.isActive !== undefined) whereClause.isActive = query.isActive;

    const [users, total] = await Promise.all([
      prismaMain.user.findMany({
        where: whereClause,
        skip,
        take,
        select: userSelect,
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.user.count({ where: whereClause }),
    ]);

    return { data: users, pagination: { page, limit, total } };
  },

  async create(data: UserCreateInput, userId?: string) {
    // Unique indexes also cover soft-deleted rows, so check without the deletedAt filter
    const emailTaken = await prismaMain.user.findFirst({
      where: { email: data.email },
    });
    if (emailTaken) {
      throw new CustomError("Email is already taken", 409);
    }

    if (data.username) {
      const usernameTaken = await prismaMain.user.findFirst({
        where: { username: data.username },
      });
      if (usernameTaken) {
        throw new CustomError("Username is already taken", 409);
      }
    }

    const { password, ...rest } = data;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      return await prismaMain.user.create({
        data: {
          ...rest,
          passwordHash,
          isAdmin: rest.role === "ADMIN",
          createdBy: userId,
        },
        select: userSelect,
      });
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("Email or username is already taken", 409);
      }
      throw error;
    }
  },

  async getById(id: string) {
    const user = await prismaMain.user.findFirst({
      where: { id, deletedAt: null },
      select: userSelect,
    });

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    return user;
  },

  async update(id: string, data: UserUpdateInput, actingUserId?: string) {
    const existing = await prismaMain.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("User not found", 404);
    }

    // An admin must not lock themselves out or demote themselves
    if (id === actingUserId) {
      if (data.isActive === false) {
        throw new CustomError("You cannot deactivate your own account", 400);
      }
      if (data.role && data.role !== existing.role) {
        throw new CustomError("You cannot change your own role", 400);
      }
    }

    if (data.email && data.email !== existing.email) {
      const emailTaken = await prismaMain.user.findFirst({
        where: { email: data.email, NOT: { id } },
      });
      if (emailTaken) {
        throw new CustomError("Email is already taken", 409);
      }
    }

    if (data.username && data.username !== existing.username) {
      const usernameTaken = await prismaMain.user.findFirst({
        where: { username: data.username, NOT: { id } },
      });
      if (usernameTaken) {
        throw new CustomError("Username is already taken", 409);
      }
    }

    try {
      return await prismaMain.user.update({
        where: { id },
        data: {
          ...data,
          ...(data.role ? { isAdmin: data.role === "ADMIN" } : {}),
          updatedBy: actingUserId,
        },
        select: userSelect,
      });
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new CustomError("Email or username is already taken", 409);
      }
      throw error;
    }
  },

  async resetPassword(
    id: string,
    data: UserResetPasswordInput,
    actingUserId?: string,
  ) {
    const existing = await prismaMain.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("User not found", 404);
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    await prismaMain.user.update({
      where: { id },
      data: {
        passwordHash,
        failedLoginCount: 0,
        lockedUntil: null,
        updatedBy: actingUserId,
      },
    });

    return null;
  },

  // Clears a lock caused by too many failed logins
  async unlock(id: string, actingUserId?: string) {
    const existing = await prismaMain.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("User not found", 404);
    }

    return prismaMain.user.update({
      where: { id },
      data: { failedLoginCount: 0, lockedUntil: null, updatedBy: actingUserId },
      select: userSelect,
    });
  },

  async delete(id: string, actingUserId?: string) {
    const existing = await prismaMain.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new CustomError("User not found", 404);
    }

    if (id === actingUserId) {
      throw new CustomError("You cannot delete your own account", 400);
    }

    // Keep at least one active admin in the system
    if (existing.role === "ADMIN") {
      const otherAdmins = await prismaMain.user.count({
        where: { role: "ADMIN", isActive: true, deletedAt: null, NOT: { id } },
      });
      if (otherAdmins === 0) {
        throw new CustomError("Cannot delete the last active admin", 400);
      }
    }

    await prismaMain.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, updatedBy: actingUserId },
    });

    return null;
  },
};
