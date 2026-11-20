"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const prismaClient_1 = require("../../lib/prismaClient");
const response_1 = require("../../utils/response");
const validator_1 = require("./validator");
const bcrypt_1 = __importDefault(require("bcrypt"));
const error_1 = require("@/utils/error");
const service_1 = require("./service");
const cookies_1 = require("@/utils/cookies");
const CustomError_1 = require("@/errors/CustomError");
const SALT_ROUNDS = 10;
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
// OTP sums used by AuthService constants
const OTP_TTL_MS = service_1.AuthService.constants.OTP_TTL_MS;
const OTP_MAX_ATTEMPTS = service_1.AuthService.constants.OTP_MAX_ATTEMPTS;
const OTP_RESEND_COOLDOWN_MS = service_1.AuthService.constants.OTP_RESEND_COOLDOWN_MS;
// Public registration must never decide its own role (privilege escalation).
// Change this to whatever role self-registered users should get.
const DEFAULT_REGISTER_ROLE = "STUDENT";
exports.AuthController = {
    test: async (req, res) => {
        try {
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Auth API is working!",
                data: {
                    timestamp: new Date().toISOString(),
                },
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    dbTest: async (req, res) => {
        const startedAt = Date.now();
        try {
            // Simple query to check PostgreSQL is reachable and ready
            await prismaClient_1.prismaMain.$queryRaw `SELECT 1`;
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "PostgreSQL is ready for queries!",
                data: {
                    status: "connected",
                    responseTimeMs: Date.now() - startedAt,
                    timestamp: new Date().toISOString(),
                },
            });
        }
        catch (error) {
            return response_1.ResponseHandler.error({
                res,
                code: 503,
                message: "PostgreSQL is not ready.",
                error: error instanceof Error ? error.message : String(error),
            });
        }
    },
    login: async (req, res) => {
        try {
            // Validate the Login Input (email OR username)
            const { identifier, password } = (0, validator_1.ValidateLogin)(req.body);
            // Find user in the DataBase (active, not soft-deleted).
            // Inactive/deleted/unknown all fall through to the same generic error
            // so the endpoint does not reveal which case it was.
            const normalizedIdentifier = identifier.trim();
            const user = await prismaClient_1.prismaMain.user.findFirst({
                where: {
                    deletedAt: null,
                    isActive: true,
                    OR: normalizedIdentifier.includes("@")
                        ? [{ email: normalizedIdentifier.toLowerCase() }]
                        : [{ username: normalizedIdentifier }],
                },
            });
            // If User is not found, Throw Error
            if (!user)
                return response_1.ResponseHandler.error({
                    res,
                    code: 400,
                    message: "Invalid Credentials",
                    error: null,
                });
            // If the account is temporarily locked, stop here
            if (user.lockedUntil && user.lockedUntil > new Date())
                return response_1.ResponseHandler.error({
                    res,
                    code: 423,
                    message: "Account is temporarily locked. Please try again later.",
                    error: null,
                });
            // Verify Password
            const isPasswordValid = await bcrypt_1.default.compare(password, user.passwordHash);
            // If Password doesn't match, count the failure and lock after too many.
            // Count is kept at the threshold (not reset) until a success resets it.
            if (!isPasswordValid) {
                const failedLoginCount = user.failedLoginCount + 1;
                const shouldLock = failedLoginCount >= MAX_FAILED_LOGINS;
                await prismaClient_1.prismaMain.user.update({
                    where: { id: user.id },
                    data: {
                        failedLoginCount,
                        lockedUntil: shouldLock
                            ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
                            : null,
                    },
                });
                return response_1.ResponseHandler.error({
                    res,
                    code: 400,
                    message: "Invalid Credentials",
                    error: null,
                });
            }
            // Reset the failed attempts and save the last login time
            await prismaClient_1.prismaMain.user.update({
                where: { id: user.id },
                data: {
                    failedLoginCount: 0,
                    lockedUntil: null,
                    lastLoginAt: new Date(),
                },
            });
            // Generate JWT token
            const token = service_1.AuthService.generateToken(user.id, user.role);
            // Generate refresh token
            const refreshToken = service_1.AuthService.generateRefreshToken(user.id);
            // Set the token in cookies
            res.cookie("token", token, cookies_1.CookieManager.accessToken());
            res.cookie("refreshToken", refreshToken, cookies_1.CookieManager.refreshToken());
            return res.status(200).json({
                message: "Login successful!",
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                },
                token: token,
                refreshToken: refreshToken,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    register: async (req, res) => {
        try {
            // Validate data from the body
            const { username, email, password } = (0, validator_1.ValidateRegister)(req.body);
            // Check Whether email is Taken or Not
            // (no deletedAt filter, because @unique on email also blocks soft deleted rows)
            const existingEmail = await prismaClient_1.prismaMain.user.findFirst({
                where: { email },
            });
            // If Email is taken then send error message
            if (existingEmail)
                return response_1.ResponseHandler.error({
                    res,
                    code: 400,
                    message: "Email is already taken.",
                    error: null,
                });
            // Check Whether Username is Taken or Not
            const existingUsername = await prismaClient_1.prismaMain.user.findFirst({
                where: { username },
            });
            // If Username is taken then send error message
            if (existingUsername)
                return response_1.ResponseHandler.error({
                    res,
                    code: 400,
                    message: "Username is already taken",
                    error: null,
                });
            // Hash the password before saving
            const passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
            // Creating User
            await prismaClient_1.prismaMain.user.create({
                data: { email, username, passwordHash, role: DEFAULT_REGISTER_ROLE },
            });
            return res.status(201).json({
                message: "Registered successful!",
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    refresh: async (req, res) => {
        try {
            // Get the refresh token from cookie (or body as fallback)
            const incomingToken = req.cookies?.refreshToken ?? req.body?.refreshToken;
            if (!incomingToken)
                return response_1.ResponseHandler.error({
                    res,
                    code: 401,
                    message: "Refresh token is required",
                    error: null,
                });
            // Verify that it is a valid refresh token
            const payload = service_1.AuthService.verifyRefreshToken(incomingToken);
            if (!payload)
                return response_1.ResponseHandler.error({
                    res,
                    code: 401,
                    message: "Invalid or expired refresh token",
                    error: null,
                });
            // The user must still exist and be active
            const user = await prismaClient_1.prismaMain.user.findFirst({
                where: { id: payload.userId, deletedAt: null, isActive: true },
            });
            if (!user)
                return response_1.ResponseHandler.error({
                    res,
                    code: 401,
                    message: "Invalid or expired refresh token",
                    error: null,
                });
            // Generate new tokens
            const token = service_1.AuthService.generateToken(user.id, user.role);
            const refreshToken = service_1.AuthService.generateRefreshToken(user.id);
            res.cookie("token", token, cookies_1.CookieManager.accessToken());
            res.cookie("refreshToken", refreshToken, cookies_1.CookieManager.refreshToken());
            return res.status(200).json({
                message: "Token refreshed successfully!",
                token: token,
                refreshToken: refreshToken,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    me: async (req, res) => {
        try {
            // Get the user info from the response locals
            const context = res.locals.context;
            // Get the user by id
            const user = await prismaClient_1.prismaMain.user.findFirst({
                where: { id: context.userId, deletedAt: null },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    role: true,
                    isEmailVerified: true,
                    // Identity details for the profile dialog (employee or student).
                    employee: {
                        select: {
                            id: true,
                            employeeCode: true,
                            firstName: true,
                            middleName: true,
                            lastName: true,
                            designation: true,
                            phone: true,
                            photoUrl: true,
                        },
                    },
                    student: {
                        select: {
                            id: true,
                            universityRegNo: true,
                            firstName: true,
                            middleName: true,
                            lastName: true,
                            phone: true,
                        },
                    },
                },
            });
            // If user no longer exists
            if (!user)
                return response_1.ResponseHandler.error({
                    res,
                    code: 404,
                    message: "User not found",
                    error: null,
                });
            // Return the success response
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "User fetched successfully!",
                data: user,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    // POST /auth/request-otp — issues a 6-digit OTP (HMAC-SHA256 hash only).
    // Same generic response for unknown/inactive/deleted email (no enumeration).
    // Non-production only: plain `code` is returned for dev/test curl flows;
    // in production it is only logged server-side (delivery integration pending).
    requestOtp: async (req, res) => {
        try {
            const { email, purpose } = (0, validator_1.ValidateRequestOtp)(req.body);
            const generic = () => response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "If an account exists for this email, a one-time code has been sent.",
                data: null,
            });
            const user = await prismaClient_1.prismaMain.user.findFirst({
                where: { email, deletedAt: null, isActive: true },
                select: { id: true },
            });
            if (!user)
                return generic();
            // 60s resend cooldown (per user + purpose)
            const recent = await prismaClient_1.prismaMain.otp.findFirst({
                where: { userId: user.id, purpose },
                orderBy: { createdAt: "desc" },
            });
            if (recent &&
                Date.now() - recent.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
                return response_1.ResponseHandler.error({
                    res,
                    code: 429,
                    message: "Please wait 60 seconds before requesting a new code.",
                    error: null,
                });
            }
            const code = (0, service_1.generateOtpCode)();
            const now = new Date();
            // Only the latest unconsumed OTP may be valid: expire all previous ones.
            await prismaClient_1.prismaMain.otp.updateMany({
                where: { userId: user.id, purpose, consumedAt: null },
                data: { expiresAt: now },
            });
            await prismaClient_1.prismaMain.otp.create({
                data: {
                    userId: user.id,
                    purpose,
                    codeHash: (0, service_1.hashOtpCode)(code),
                    expiresAt: new Date(now.getTime() + OTP_TTL_MS),
                },
            });
            if (process.env.NODE_ENV === "production") {
                // eslint-disable-next-line no-console
                console.log(`[OTP] ${purpose} for ${email}: ${code}`);
                return generic();
            }
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "One-time code generated (dev only — do not ship this).",
                data: { code },
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    // POST /auth/verify-otp — checks the latest unconsumed, unexpired OTP.
    // Wrong: attempts++ (locks at 5). Right: consumedAt set; EMAIL_VERIFY also
    // flips User.isEmailVerified = true. Never returns passwordHash/codeHash.
    verifyOtp: async (req, res) => {
        try {
            const { email, purpose, code } = (0, validator_1.ValidateVerifyOtp)(req.body);
            const invalid = () => response_1.ResponseHandler.error({
                res,
                code: 400,
                message: "Invalid or expired code.",
                error: null,
            });
            const user = await prismaClient_1.prismaMain.user.findFirst({
                where: { email, deletedAt: null },
                select: { id: true },
            });
            if (!user)
                return invalid();
            const otp = await prismaClient_1.prismaMain.otp.findFirst({
                where: { userId: user.id, purpose, consumedAt: null },
                orderBy: { createdAt: "desc" },
            });
            if (!otp)
                return invalid();
            if (otp.expiresAt.getTime() <= Date.now())
                return invalid();
            if (otp.attempts >= OTP_MAX_ATTEMPTS)
                return invalid();
            if (!(0, service_1.verifyOtpCodeHash)(code, otp.codeHash)) {
                await prismaClient_1.prismaMain.otp.update({
                    where: { id: otp.id },
                    data: { attempts: otp.attempts + 1 },
                });
                return invalid();
            }
            const now = new Date();
            await prismaClient_1.prismaMain.otp.update({
                where: { id: otp.id },
                data: { consumedAt: now },
            });
            if (purpose === "EMAIL_VERIFY") {
                await prismaClient_1.prismaMain.user.update({
                    where: { id: user.id },
                    data: { isEmailVerified: true },
                });
            }
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Code verified successfully.",
                data: {
                    verified: true,
                    emailVerified: purpose === "EMAIL_VERIFY",
                },
            });
        }
        catch (error) {
            if (error instanceof CustomError_1.CustomError)
                return error_1.ErrorHandler.handleError(res, error);
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    logout: async (req, res) => {
        try {
            // Clear the cookies
            res.clearCookie("token");
            res.clearCookie("refreshToken");
            return res.status(200).json({
                message: "Logged out successfully!",
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
