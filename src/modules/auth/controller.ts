import { prismaMain } from "../../lib/prismaClient";
import { ResponseHandler } from "../../utils/response";
import { ValidateLogin, ValidateRegister } from "./validator";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { ErrorHandler } from "@/utils/error";
import { AuthService } from "./service";
import { CookieManager } from "@/utils/cookies";

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

      // Find user in the DataBase
      const user = await prismaMain.user.findUnique({
        where: { email },
      });

      // If User is not found , Throw Error
      if (!user)
        return ResponseHandler.error({
          res,
          code: 400,
          message: "Invalid Credentials",
          error: null,
        });

      // Verify Password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      // If Password doesn't match Throw a Error
      if (!isPasswordValid)
        return ResponseHandler.error({
          res,
          code: 400,
          message: "Invalid Credentials",
          error: null,
        });

      // Generate JWT token
      const token = AuthService.generateToken(user.id, user.role);

      // Generate refresh token
      const refreshToken = AuthService.generateRefershToken(user.id, user.role);

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
      const Email = await prismaMain.user.findFirst({
        where: { email },
      });
      // If Email is taken then send error message
      if (!!Email)
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
      if (!!existingUsername)
        return ResponseHandler.error({
          res,
          code: 400,
          message: "Username is already taken",
          error: null,
        });
      // Hash the password before
      const hashedPassword = await bcrypt.hash(password, 10);
      // Creating User
      const createdUser = await prismaMain.user.create({
        data: { email: email, username: username, password: hashedPassword },
      });
      return res.status(200).json({
        message: "Registered successful!",
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
      const user = await prismaMain.user.findUnique({
        where: { id: context.userId },
        select: { id: true, email: true, username: true, role: true },
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
      console.log("Hello ma ya xu");
      // Clear the cookie
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
