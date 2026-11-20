"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeAttendanceRouter = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const isUser_1 = require("@/middlewares/isUser");
const permission_1 = require("@/middlewares/permission");
const router = (0, express_1.Router)();
// Matrix: admin reads, principal creates/updates, accountant reads.
router.get("/", isUser_1.isUser, (0, permission_1.requirePermission)("employeeAttendance", "read"), controller_1.EmployeeAttendanceController.index);
router.post("/bulk", isUser_1.isUser, (0, permission_1.requirePermission)("employeeAttendance", "create"), controller_1.EmployeeAttendanceController.bulkMark);
router.post("/", isUser_1.isUser, (0, permission_1.requirePermission)("employeeAttendance", "create"), controller_1.EmployeeAttendanceController.create);
router.get("/:id", isUser_1.isUser, (0, permission_1.requirePermission)("employeeAttendance", "read"), controller_1.EmployeeAttendanceController.retrieve);
router.patch("/:id", isUser_1.isUser, (0, permission_1.requirePermission)("employeeAttendance", "update"), controller_1.EmployeeAttendanceController.update);
router.delete("/:id", isUser_1.isUser, (0, permission_1.requirePermission)("employeeAttendance", "delete"), controller_1.EmployeeAttendanceController.delete);
exports.employeeAttendanceRouter = router;
