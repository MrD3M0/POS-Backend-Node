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
exports.AuthController = {
    login: async (req, res) => {
        try {
            // Validate the Login Input
            const { email, password } = (0, validator_1.ValidateLogin)(req.body);
            // Find user in the DataBase
            const user = await prismaClient_1.prismaMain.user.findUnique({
                where: { email },
            });
            // If User is not found , Throw Error
            if (!user)
                return response_1.ResponseHandler.error({
                    res,
                    code: 400,
                    message: "Invalid Credentials",
                    error: null,
                });
            // Verify Password
            const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
            // If Password doesn't match Throw a Error
            if (!isPasswordValid)
                return response_1.ResponseHandler.error({
                    res,
                    code: 400,
                    message: "Invalid Credentials",
                    error: null,
                });
            // Generate JWT token
            const token = service_1.AuthService.generateToken(user.id);
            // Generate refresh token
            const refreshToken = service_1.AuthService.generateRefershToken(user.id);
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
            const Email = await prismaClient_1.prismaMain.user.findFirst({
                where: { email },
            });
            // If Email is taken then send error message
            if (!!Email)
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
            if (!!existingUsername)
                return response_1.ResponseHandler.error({
                    res,
                    code: 400,
                    message: "Username is already taken",
                    error: null,
                });
            // Hash the password before
            const hashedPassword = await bcrypt_1.default.hash(password, 10);
            // Creating User
            const createdUser = await prismaClient_1.prismaMain.user.create({
                data: { email: email, username: username, password: hashedPassword },
            });
            return res.status(200).json({
                message: "Registered successful!",
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
            const user = await prismaClient_1.prismaMain.user.findUnique({
                where: { id: context.userId },
                select: { id: true, email: true, username: true, role: true },
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
};
