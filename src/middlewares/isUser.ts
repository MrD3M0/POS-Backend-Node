import { Request, Response, NextFunction } from "express";
import { AuthService } from "../modules/auth/service";
import { CustomError } from "@/errors/CustomError";
import { T_Context } from "@/@types/type";
import { CookieManager } from "@/utils/cookies";

export const isUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get the token from cookie or authorization header
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    const refreshToken = req.cookies.refreshToken;
    console.log(token);

    // Validate Tokens
    const decoded = token ? AuthService.verifyToken(token) : null;
    const decodedRefresh = refreshToken
      ? AuthService.verifyToken(refreshToken)
      : null;

    // Create userContext from decoded token data
    let userContext: T_Context;

    // If both tokens are invalid or missing , throw unauthorized error
    if (!decoded && !decodedRefresh) {
      throw new CustomError("Unauthorized", 401);
    }

    // If the token is invalid but the refresh token is valid, refresh the token
    if (!decoded && decodedRefresh) {
      const tokenData = decodedRefresh as T_Context;
      const newToken = AuthService.generateToken(
        tokenData.userId,
        tokenData.role,
      );

      // Set the new token in cookies
      res.cookie("token", newToken, CookieManager.accessToken());

      // Also send the new token in response header for clients using Authorization header
      res.setHeader("Authorization", `Bearer ${newToken}`);
      // Use the refresh token data as context
      userContext = tokenData;
    } else {
      // Use the decoded token data as context
      userContext = decoded as T_Context;
    }
    // Attach user info to response locals
    res.locals.context = userContext;
    return next();
  } catch (error) {
    // If any error occurs, handle the error
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized", error });
  }
};

export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get the token from cookie or authorization header
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    const refreshToken = req.cookies.refreshToken;

    // Validate Tokens
    const decoded = token ? AuthService.verifyToken(token) : null;
    const decodedRefresh = refreshToken
      ? AuthService.verifyToken(refreshToken)
      : null;

    // Create userContext from decoded token data
    let userContext: T_Context;

    // If both tokens are invalid or missing , throw unauthorized error
    if (!decoded && !decodedRefresh) {
      throw new CustomError("Unauthorized", 401);
    }

    // If the token is invalid but the refresh token is valid, refresh the token
    if (!decoded && decodedRefresh) {
      const tokenData = decodedRefresh as T_Context;
      const newToken = AuthService.generateToken(
        tokenData.userId,
        tokenData.role,
      );

      // Set the new token in cookies
      res.cookie("token", newToken, CookieManager.accessToken());

      // Also send the new token in response header for clients using Authorization header
      res.setHeader("Authorization", `Bearer ${newToken}`);
      // Use the refresh token data as context
      userContext = tokenData;
    } else {
      // Use the decoded token data as context
      userContext = decoded as T_Context;
    }

    // Check if user is admin
    if (userContext.role !== "Admin") {
      console.log(userContext.role);
      throw new CustomError("Forbidden: Admin access required", 403);
    }

    // Attach user info to response locals
    res.locals.context = userContext;
    return next();
  } catch (error) {
    // If any error occurs, handle the error
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized", error });
  }
};
