import jwt from "jsonwebtoken";
import "dotenv/config";

export const AuthService = {
  generateToken: (userId: string): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not defined in .env");

    return jwt.sign({ userId }, secret, {
      expiresIn: Number(process.env.JWT_EXPIRES_IN) || 3600,
    });
  },
  generateRefershToken: (userId: string) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not defined in .env");
    return jwt.sign({ userId }, secret, {
      expiresIn: Number(process.env.JWT_REFRESH_EXPIRES_IN) || 86400,
    });
  },
  verifyToken: (token: string) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || " ");
      return decoded;
    } catch (error) {
      return null;
    }
  },
};
