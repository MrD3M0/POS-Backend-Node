import { prismaMain } from "../../lib/prismaClient";
import { ResponseHandler } from "../../utils/response";
import { ValidateLogin, ValidateRegister } from "./validator";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { ErrorHandler } from "@/utils/error";
import { AuthService } from "./service";
import { CookieManager } from "@/utils/cookies";

const SALT_ROUNDS = 10;
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

// Public registration must never decide its own role (privilege escalation).
// Change this to whatever role self-registered users should get.
const DEFAULT_REGISTER_ROLE = "STUDENT" as const;

export const AuthController = {
  test: async (req: Request, res: Response) => {
    try {
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Auth API is working!",
        data: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
  dbTest: async (req: Request, res: Response) => {
    const startedAt = Date.now();
    try {
      // Simple query to check PostgreSQL is reachable and ready
      await prismaMain.$queryRaw`SELECT 1`;

      return ResponseHandler.success({
        res,
        code: 200,
        message: "PostgreSQL is ready for queries!",
        data: {
          status: "connected",
          responseTimeMs: Date.now() - startedAt,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      return ResponseHandler.error({
        res,
        code: 503,
        message: "PostgreSQL is not ready.",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
  login: async (req: Request, res: Response) => {
    try {
      // Validate the Login Input
      const { email, password } = ValidateLogin(req.body);

      // Find user in the DataBase (ignore soft deleted users)
      const user = await prismaMain.user.findFirst({
        where: { email, deletedAt: null },
      });

      // If User is not found , Throw Error
      if (!user)
        return ResponseHandler.error({
          res,
          code: 400,
          message: "Invalid Credentials",
          error: null,
        });

      // If the account is temporarily locked, stop here
      if (user.lockedUntil && user.lockedUntil > new Date())
        return ResponseHandler.error({
          res,
          code: 423,
          message: "Account is temporarily locked. Please try again later.",
          error: null,
        });

      // Verify Password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      // If Password doesn't match, count the failure and lock after too many
      if (!isPasswordValid) {
        const failedLoginCount = user.failedLoginCount + 1;
        const shouldLock = failedLoginCount >= MAX_FAILED_LOGINS;

        await prismaMain.user.update({
          where: { id: user.id },
          data: {
            failedLoginCount: shouldLock ? 0 : failedLoginCount,
            lockedUntil: shouldLock
              ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
              : null,
          },
        });

        return ResponseHandler.error({
          res,
          code: 400,
          message: "Invalid Credentials",
          error: null,
        });
      }

      // Password is correct, but the account may be deactivated by admin
      if (!user.isActive)
        return ResponseHandler.error({
          res,
          code: 403,
          message: "Your account is deactivated. Please contact the admin.",
          error: null,
        });

      // Reset the failed attempts and save the last login time
      await prismaMain.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
        },
      });

      // Generate JWT token
      const token = AuthService.generateToken(user.id, user.role);

      // Generate refresh token
      const refreshToken = AuthService.generateRefreshToken(user.id);

      // Set the token in cookies
      res.cookie("token", token, CookieManager.accessToken());
      res.cookie("refreshToken", refreshToken, CookieManager.refreshToken());

      return res.status(200).json({
        message: "Login successful!",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token: token,
        refreshToken: refreshToken,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
  register: async (req: Request, res: Response) => {
    try {
      // Validate data from the body
      const { username, email, password } = ValidateRegister(req.body);

      // Check Whether email is Taken or Not
      // (no deletedAt filter, because @unique on email also blocks soft deleted rows)
      const existingEmail = await prismaMain.user.findFirst({
        where: { email },
      });

      // If Email is taken then send error message
      if (existingEmail)
        return ResponseHandler.error({
          res,
          code: 400,
          message: "Email is already taken.",
          error: null,
        });

      // Check Whether Username is Taken or Not
      const existingUsername = await prismaMain.user.findFirst({
        where: { username },
      });

      // If Username is taken then send error message
      if (existingUsername)
        return ResponseHandler.error({
          res,
          code: 400,
          message: "Username is already taken",
          error: null,
        });

      // Hash the password before saving
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Creating User
      await prismaMain.user.create({
        data: { email, username, passwordHash, role: DEFAULT_REGISTER_ROLE },
      });

      return res.status(201).json({
        message: "Registered successful!",
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
  refresh: async (req: Request, res: Response) => {
    try {
      // Get the refresh token from cookie (or body as fallback)
      const incomingToken = req.cookies?.refreshToken ?? req.body?.refreshToken;

      if (!incomingToken)
        return ResponseHandler.error({
          res,
          code: 401,
          message: "Refresh token is required",
          error: null,
        });

      // Verify that it is a valid refresh token
      const payload = AuthService.verifyRefreshToken(incomingToken);

      if (!payload)
        return ResponseHandler.error({
          res,
          code: 401,
          message: "Invalid or expired refresh token",
          error: null,
        });

      // The user must still exist and be active
      const user = await prismaMain.user.findFirst({
        where: { id: payload.userId, deletedAt: null, isActive: true },
      });

      if (!user)
        return ResponseHandler.error({
          res,
          code: 401,
          message: "Invalid or expired refresh token",
          error: null,
        });

      // Generate new tokens
      const token = AuthService.generateToken(user.id, user.role);
      const refreshToken = AuthService.generateRefreshToken(user.id);

      res.cookie("token", token, CookieManager.accessToken());
      res.cookie("refreshToken", refreshToken, CookieManager.refreshToken());

      return res.status(200).json({
        message: "Token refreshed successfully!",
        token: token,
        refreshToken: refreshToken,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
  me: async (req: Request, res: Response) => {
    try {
      // Get the user info from the response locals
      const context = res.locals.context;

      // Get the user by id
      const user = await prismaMain.user.findFirst({
        where: { id: context.userId, deletedAt: null },
        select: { id: true, email: true, username: true, role: true },
      });

      // If user no longer exists
      if (!user)
        return ResponseHandler.error({
          res,
          code: 404,
          message: "User not found",
          error: null,
        });

      // Return the success response
      return ResponseHandler.success({
        res,
        code: 200,
        message: "User fetched successfully!",
        data: user,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
  logout: async (req: Request, res: Response) => {
    try {
      // Clear the cookies
      res.clearCookie("token");
      res.clearCookie("refreshToken");
      return res.status(200).json({
        message: "Logged out successfully!",
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
