"use strict";
// =====================================================================
// Single permission matrix (section 4 of the admin spec).
// Backend middleware and the frontend map must not drift: this is the
// server-side source of truth; the frontend mirrors it for UX only.
//
// Legend: create/read/update/delete/approve/publish/post/prepare/pay/unlock
// =====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSION_MATRIX = exports.MODULES = exports.ACTIONS = exports.ROLES = void 0;
exports.rolesFor = rolesFor;
exports.can = can;
exports.permissionsForRole = permissionsForRole;
exports.ROLES = [
    "ADMIN",
    "PRINCIPAL",
    "ACCOUNTANT",
    "TEACHER",
    "STAFF",
    "STUDENT",
];
exports.ACTIONS = [
    "create",
    "read",
    "update",
    "delete",
    "approve",
    "publish",
    "post",
    "prepare",
    "pay",
    "unlock",
];
exports.MODULES = [
    "users",
    "employees",
    "students",
    "academic",
    "classSchedule",
    "assignments",
    "teacherPay",
    "lookups",
    "calendar",
    "taxSlabs",
    "accounts",
    "journal",
    "fees",
    "scholarships",
    "payroll",
    "results",
    "studentAttendance",
    "employeeAttendance",
    "settings",
    "notices",
    "audit",
    "dashboard",
];
const ADMIN_ONLY = ["ADMIN"];
exports.PERMISSION_MATRIX = {
    users: {
        create: ADMIN_ONLY,
        read: ADMIN_ONLY,
        update: ADMIN_ONLY,
        delete: ADMIN_ONLY,
    },
    employees: {
        create: ADMIN_ONLY,
        read: ["ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF"],
        update: ADMIN_ONLY,
        delete: ADMIN_ONLY,
    },
    students: {
        create: ["ADMIN", "TEACHER"],
        read: ["ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STUDENT"],
        update: ["ADMIN", "TEACHER"],
        delete: ADMIN_ONLY,
        // Admission decisions (approve / reject / change status): admin or
        // principal (the principal runs the /principal/students/approval page).
        approve: ["ADMIN", "PRINCIPAL"],
    },
    academic: {
        // Setup screens are shared: admin owns them, and the principal may also
        // maintain batches, terms (incl. term subjects) and subjects.
        create: ["ADMIN", "PRINCIPAL"],
        read: ["ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STUDENT"],
        update: ["ADMIN", "PRINCIPAL"],
        delete: ["ADMIN", "PRINCIPAL"],
    },
    classSchedule: {
        // ADMIN owns setup; PRINCIPAL read-only; TEACHER reads own schedule
        // (ownership enforced per-request in the controller/service).
        create: ADMIN_ONLY,
        read: ["ADMIN", "PRINCIPAL", "TEACHER"],
        update: ADMIN_ONLY,
        delete: ADMIN_ONLY,
    },
    assignments: {
        create: ADMIN_ONLY,
        read: ["ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER"],
        update: ADMIN_ONLY,
        delete: ADMIN_ONLY,
    },
    teacherPay: {
        create: ADMIN_ONLY,
        read: ["ADMIN", "PRINCIPAL", "ACCOUNTANT"],
        update: ADMIN_ONLY,
        delete: ADMIN_ONLY,
    },
    lookups: {
        create: ADMIN_ONLY,
        read: ["ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER"],
        update: ADMIN_ONLY,
        delete: ADMIN_ONLY,
    },
    calendar: {
        create: ADMIN_ONLY,
        read: ["ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF", "STUDENT"],
        update: ADMIN_ONLY,
        delete: ADMIN_ONLY,
    },
    taxSlabs: {
        create: ADMIN_ONLY,
        read: ["ADMIN", "PRINCIPAL", "ACCOUNTANT"],
        update: ADMIN_ONLY,
        delete: ADMIN_ONLY,
    },
    accounts: {
        create: ADMIN_ONLY,
        read: ["ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER"],
        update: ADMIN_ONLY,
        delete: ADMIN_ONLY,
    },
    journal: {
        // Admin and principal may look, only the accountant posts/reverses.
        read: ["ADMIN", "PRINCIPAL", "ACCOUNTANT"],
        create: ["ACCOUNTANT"],
        post: ["ACCOUNTANT"],
        delete: [],
    },
    fees: {
        create: ["ACCOUNTANT"],
        read: ["ADMIN", "PRINCIPAL", "ACCOUNTANT", "STUDENT"],
        update: ["ACCOUNTANT"],
        delete: ["ACCOUNTANT"],
        // Emergency override only (module L). Accountant is the normal path.
        approve: ["ACCOUNTANT", "ADMIN"],
    },
    scholarships: {
        // The accountant grants scholarships (the principal may only look).
        create: ["ADMIN", "ACCOUNTANT"],
        read: ["ADMIN", "PRINCIPAL", "ACCOUNTANT"],
        update: ["ADMIN", "ACCOUNTANT"],
        delete: ["ADMIN", "ACCOUNTANT"],
    },
    payroll: {
        create: ["ACCOUNTANT"],
        read: ["ADMIN", "PRINCIPAL", "ACCOUNTANT"],
        update: ["ACCOUNTANT"],
        delete: ["ACCOUNTANT"],
        prepare: ["ACCOUNTANT"],
        approve: ["PRINCIPAL"],
        pay: ["ACCOUNTANT"],
    },
    results: {
        create: ["TEACHER"],
        read: ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT"],
        update: ["TEACHER"],
        delete: ["TEACHER"],
        approve: ["PRINCIPAL"],
        publish: ["PRINCIPAL"],
    },
    studentAttendance: {
        create: ["TEACHER"],
        read: ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT"],
        update: ["TEACHER"],
        delete: ["TEACHER"],
        unlock: ["ADMIN", "PRINCIPAL"],
    },
    employeeAttendance: {
        create: ["PRINCIPAL"],
        read: ["ADMIN", "PRINCIPAL", "ACCOUNTANT"],
        update: ["PRINCIPAL"],
        delete: ["PRINCIPAL"],
    },
    settings: {
        create: ADMIN_ONLY,
        read: ["ADMIN", "PRINCIPAL"],
        // The principal owns college identity (logo, contacts, ID card details);
        // the service restricts principal writes to the "college" group.
        update: ["ADMIN", "PRINCIPAL"],
        delete: ADMIN_ONLY,
    },
    notices: {
        // Admin, principal and accountant may address anybody; a teacher may only
        // address the classes they teach (enforced in the notice service).
        create: ["ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER"],
        read: ["ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF", "STUDENT"],
        update: ["ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER"],
        delete: ["ADMIN", "PRINCIPAL"],
        publish: ["ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER"],
    },
    audit: {
        read: ["ADMIN", "PRINCIPAL"],
    },
    dashboard: {
        read: ["ADMIN"],
    },
};
function rolesFor(module, action) {
    return exports.PERMISSION_MATRIX[module][action] ?? [];
}
function can(role, module, action) {
    if (!role)
        return false;
    return rolesFor(module, action).includes(role);
}
/** All modules/actions the given role may perform, used by the frontend bootstrap. */
function permissionsForRole(role) {
    const result = {};
    if (!role)
        return result;
    for (const module of exports.MODULES) {
        const actions = Object.entries(exports.PERMISSION_MATRIX[module])
            .filter(([, roles]) => roles.includes(role))
            .map(([action]) => action);
        if (actions.length > 0)
            result[module] = actions;
    }
    return result;
}
