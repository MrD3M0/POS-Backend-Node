"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROFILE_ROLE = exports.EMPLOYEE_SAFE_SELECT = void 0;
exports.isProfileRole = isProfileRole;
exports.assertSingleRoleProfile = assertSingleRoleProfile;
exports.assertEmployeeRoleCompatible = assertEmployeeRoleCompatible;
exports.friendlyUniqueError = friendlyUniqueError;
exports.nextEmployeeCode = nextEmployeeCode;
const CustomError_1 = require("@/errors/CustomError");
// Employee fields safe to return in nested includes.
// bankAccountNo is intentionally omitted (DECISIONS.md Feature 2:
// nested `employee: true` must never leak the raw bank account number).
// The top-level Employee endpoints mask it as `****1234` instead.
exports.EMPLOYEE_SAFE_SELECT = {
    id: true,
    userId: true,
    employeeCode: true,
    firstName: true,
    middleName: true,
    lastName: true,
    gender: true,
    dobBs: true,
    phone: true,
    email: true,
    permanentAddress: true,
    temporaryAddress: true,
    photoUrl: true,
    designation: true,
    joinDateBs: true,
    leaveDateBs: true,
    panNo: true,
    ssfNo: true,
    bankName: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    createdBy: true,
    updatedBy: true,
    deletedAt: true,
};
exports.PROFILE_ROLE = {
    PRINCIPAL: "PRINCIPAL",
    TEACHER: "TEACHER",
    ACCOUNTANT: "ACCOUNTANT",
    STAFF: "STAFF",
};
const PROFILE_MODEL = {
    PRINCIPAL: "principal",
    TEACHER: "teacher",
    ACCOUNTANT: "accountant",
    STAFF: "staff",
};
/** True when `role` is one of the four employee profile roles. */
function isProfileRole(role) {
    return role === "PRINCIPAL" || role === "TEACHER" || role === "ACCOUNTANT" || role === "STAFF";
}
/**
 * Enforce single role profile + User.role match before creating/updating
 * a Principal/Teacher/Accountant/Staff profile for `employeeId`.
 * `excludeId` is the profile row being updated (same-kind row is allowed).
 */
async function assertSingleRoleProfile(tx, employeeId, kind, excludeId) {
    for (const other of Object.keys(PROFILE_MODEL)) {
        if (other === kind)
            continue;
        const model = tx[PROFILE_MODEL[other]];
        const conflict = await model.findFirst({
            where: { employeeId, deletedAt: null },
            select: { id: true },
        });
        if (conflict) {
            throw new CustomError_1.CustomError(`This employee already has a ${other} profile; an employee can have exactly one role profile (Principal XOR Teacher XOR Accountant XOR Staff)`, 409);
        }
    }
    const employee = await tx.employee.findFirst({
        where: { id: employeeId, deletedAt: null },
        select: { userId: true },
    });
    if (!employee)
        throw new CustomError_1.CustomError("Employee not found or has been deleted", 404);
    if (employee.userId) {
        const user = await tx.user.findFirst({
            where: { id: employee.userId, deletedAt: null },
            select: { role: true },
        });
        if (!user)
            throw new CustomError_1.CustomError("Linked user not found or has been deleted", 404);
        if (user.role !== exports.PROFILE_ROLE[kind]) {
            throw new CustomError_1.CustomError(`User.role (${user.role}) does not match profile type ${kind}; update the linked user's role first`, 409);
        }
    }
}
/**
 * For Employee create/update: if `role` is a profile role, it must match
 * any profile the employee already has (and the linked user's role).
 */
async function assertEmployeeRoleCompatible(tx, employeeId, role, userId) {
    if (!isProfileRole(role))
        return;
    for (const kind of Object.keys(PROFILE_MODEL)) {
        if (kind === role)
            continue;
        const conflict = await tx[PROFILE_MODEL[kind]].findFirst({
            where: { employeeId, deletedAt: null },
            select: { id: true },
        });
        if (conflict) {
            throw new CustomError_1.CustomError(`Employee already has a ${kind} profile; role ${role} would create a second role profile`, 409);
        }
    }
    if (userId) {
        const user = await tx.user.findFirst({
            where: { id: userId, deletedAt: null },
            select: { role: true },
        });
        if (user && user.role !== role) {
            throw new CustomError_1.CustomError(`User.role (${user.role}) does not match requested role ${role}`, 409);
        }
    }
}
/** Map a Prisma P2002 unique violation to a friendly 409, else null. */
function friendlyUniqueError(error, mapping) {
    if (!error || error.code !== "P2002")
        return null;
    const target = error.meta?.target;
    const fields = Array.isArray(target) ? target.map(String) : [];
    for (const [field, message] of Object.entries(mapping)) {
        if (fields.includes(field))
            return new CustomError_1.CustomError(message, 409);
    }
    return new CustomError_1.CustomError("Duplicate entry found", 409);
}
/** Next sequential EMP-XXXX code computed inside a transaction. */
async function nextEmployeeCode(tx) {
    const rows = await tx.employee.findMany({ select: { employeeCode: true } });
    let max = 0;
    for (const r of rows) {
        const m = /^EMP-(\d+)$/.exec(r.employeeCode);
        if (m) {
            const n = Number(m[1]);
            if (Number.isInteger(n) && n > max)
                max = n;
        }
    }
    return `EMP-${String(max + 1).padStart(4, "0")}`;
}
