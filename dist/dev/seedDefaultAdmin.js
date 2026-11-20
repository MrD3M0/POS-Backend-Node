"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDefaultAdmin = seedDefaultAdmin;
const prismaClient_1 = require("@/lib/prismaClient");
const bcrypt = __importStar(require("bcrypt"));
async function seedDefaultAdmin() {
    const email = 'admin@gmail.com';
    const plainPassword = 'admin123';
    try {
        // Check if admin already exists
        const existingUser = await prismaClient_1.prismaMain.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            console.log('Default admin user already exists.');
            return;
        }
        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
        // Create the admin user
        const adminUser = await prismaClient_1.prismaMain.user.create({
            data: {
                email: email,
                passwordHash: hashedPassword,
                // Add other required fields based on your schema (e.g., role, name, etc.)
                role: 'ADMIN',
                isEmailVerified: true,
            },
        });
        console.log(`Default admin created successfully: ${adminUser.email}`);
    }
    catch (error) {
        console.error('Error creating default admin user:', error);
    }
    finally {
        await prismaClient_1.prismaMain.$disconnect();
    }
}
