"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogRouter = void 0;
const express_1 = require("express");
const isUser_1 = require("@/middlewares/isUser");
const permission_1 = require("@/middlewares/permission");
const controller_1 = require("./controller");
const router = (0, express_1.Router)();
// Read-only by design: no POST/PATCH/DELETE routes exist for audit rows.
router.get("/", isUser_1.isUser, (0, permission_1.requirePermission)("audit", "read"), controller_1.AuditLogController.index);
router.get("/options", isUser_1.isUser, (0, permission_1.requirePermission)("audit", "read"), controller_1.AuditLogController.options);
router.get("/:id", isUser_1.isUser, (0, permission_1.requirePermission)("audit", "read"), controller_1.AuditLogController.retrieve);
exports.auditLogRouter = router;
