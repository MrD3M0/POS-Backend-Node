"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUser = void 0;
const service_1 = require("../modules/auth/service");
const CustomError_1 = require("@/errors/CustomError");
const cookies_1 = require("@/utils/cookies");
const isUser = async (req, res, next) => {
  try {
    // Get the token from cookie or authorization header
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    const refreshToken = req.cookies.refreshToken;
    console.log("Request received");
    // Validate Tokens
    const decoded = token ? service_1.AuthService.verifyToken(token) : null;
    const decodedRefresh = refreshToken
      ? service_1.AuthService.verifyToken(refreshToken)
      : null;
    // Create userContext from decoded token data
    let userContext;
    // If both tokens are invalid or missing , throw unauthorized error
    if (!decoded && !decodedRefresh) {
      throw new CustomError_1.CustomError("Unauthorized", 401);
    }
    // If the token is invalid but the refresh token is valid, refresh the token
    if (!decoded && decodedRefresh) {
      const tokenData = decodedRefresh;
      const newToken = service_1.AuthService.generateToken(tokenData.userId);
      // Set the new token in cookies
      res.cookie("token", newToken, cookies_1.CookieManager.accessToken());
      // Also send the new token in response header for clients using Authorization header
      res.setHeader("Authorization", `Bearer ${newToken}`);
      // Use the refresh token data as context
      userContext = tokenData;
    } else {
      // Use the decoded token data as context
      userContext = decoded;
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
exports.isUser = isUser;
