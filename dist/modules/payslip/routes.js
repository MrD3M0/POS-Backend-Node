"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payslipRouter = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const isUser_1 = require("@/middlewares/isUser");
const permission_1 = require("@/middlewares/permission");
const router = (0, express_1.Router)();
// Payslips are generated/owned by payroll; admin/principal/accountant may view.
router.get("/", isUser_1.isUser, (0, permission_1.requirePermission)("payroll", "read"), controller_1.PayslipController.index);
router.post("/", isUser_1.isUser, (0, permission_1.requirePermission)("payroll", "prepare"), controller_1.PayslipController.create);
router.get("/:id", isUser_1.isUser, (0, permission_1.requirePermission)("payroll", "read"), controller_1.PayslipController.retrieve);
// No update/delete: payslip has no deletedAt and is system-owned.
router.use((_, res) => res.status(405).json({ success: false, message: "Payslips cannot be edited or deleted" }));
exports.payslipRouter = router;
