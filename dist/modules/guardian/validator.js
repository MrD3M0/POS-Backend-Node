"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGuardianCreate = exports.guardianCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.guardianCreateInputSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid("Invalid Student ID format"),
    relation: zod_1.z.enum(["FATHER", "MOTHER", "GUARDIAN", "OTHER"], {
        message: "Relation must be FATHER, MOTHER, GUARDIAN, or OTHER",
    }),
    fullName: zod_1.z.string().min(1, "Full name is required"),
    phone: zod_1.z.string().optional(),
    email: zod_1.z.string().email("Invalid email format").optional(),
    occupation: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    isPrimary: zod_1.z.boolean().optional(),
});
const validateGuardianCreate = (data) => {
    return exports.guardianCreateInputSchema.parse(data);
};
exports.validateGuardianCreate = validateGuardianCreate;
