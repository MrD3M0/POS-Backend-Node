"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountantDashboardRouter = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const isUser_1 = require("@/middlewares/isUser");
const authorized_1 = require("@/middlewares/authorized");
const router = (0, express_1.Router)();
// The accountant owns the finance module; admin and principal may read it.
const READ_ROLES = ["ACCOUNTANT", "ADMIN", "PRINCIPAL"];
router.get("/kpis", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)(...READ_ROLES), controller_1.AccountantDashboardController.kpis);
router.get("/fee-analytics", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)(...READ_ROLES), controller_1.AccountantDashboardController.feeAnalytics);
router.get("/collections", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)(...READ_ROLES), controller_1.AccountantDashboardController.collections);
router.get("/journal", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)(...READ_ROLES), controller_1.AccountantDashboardController.journal);
router.get("/payroll-alerts", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)(...READ_ROLES), controller_1.AccountantDashboardController.payrollAndAlerts);
exports.accountantDashboardRouter = router;
