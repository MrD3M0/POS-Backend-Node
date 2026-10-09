import jwt from "jsonwebtoken";
import "dotenv/config";

export const AuthService = {
  generateToken: (userId: string, role: string): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not defined in .env");

    return jwt.sign({ userId, role, type: "access" }, secret, {
      expiresIn: Number(process.env.JWT_EXPIRES_IN) || 3600,
    });
  },
  generateRefreshToken: (userId: string): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not defined in .env");

    return jwt.sign({ userId, type: "refresh" }, secret, {
      expiresIn: Number(process.env.JWT_REFRESH_EXPIRES_IN) || 86400,
    });
  },
  verifyToken: (token: string) => {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error("JWT_SECRET is not defined");
      const decoded = jwt.verify(token, secret);
      return decoded;
    } catch (error) {
      return null;
    }
  },
  // Only accepts tokens that were created as refresh tokens
  verifyRefreshToken: (token: string): { userId: string } | null => {
    const decoded = AuthService.verifyToken(token);
    if (!decoded || typeof decoded === "string") return null;
    if (decoded.type !== "refresh" || typeof decoded.userId !== "string")
      return null;
    return { userId: decoded.userId };
  },
};
