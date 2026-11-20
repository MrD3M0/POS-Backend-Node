import { Router } from "express";
import { AccountantDashboardController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

// The accountant owns the finance module; admin and principal may read it.
const READ_ROLES = ["ACCOUNTANT", "ADMIN", "PRINCIPAL"] as const;

router.get("/kpis", isUser, isAuthorizedTo(...READ_ROLES), AccountantDashboardController.kpis);
router.get(
  "/fee-analytics",
  isUser,
  isAuthorizedTo(...READ_ROLES),
  AccountantDashboardController.feeAnalytics,
);
router.get(
  "/collections",
  isUser,
  isAuthorizedTo(...READ_ROLES),
  AccountantDashboardController.collections,
);
router.get("/journal", isUser, isAuthorizedTo(...READ_ROLES), AccountantDashboardController.journal);
router.get(
  "/payroll-alerts",
  isUser,
  isAuthorizedTo(...READ_ROLES),
  AccountantDashboardController.payrollAndAlerts,
);

export const accountantDashboardRouter = router;
