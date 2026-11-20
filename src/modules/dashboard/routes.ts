import { Router } from "express";
import { DashboardController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get("/admin", isUser, isAuthorizedTo("ADMIN"), DashboardController.admin);
router.get(
  "/principal",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  DashboardController.principal,
);
router.get(
  "/accountant",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT"),
  DashboardController.accountant,
);
router.get(
  "/teacher",
  isUser,
  isAuthorizedTo("ADMIN", "TEACHER"),
  DashboardController.teacher,
);
router.get(
  "/staff",
  isUser,
  isAuthorizedTo("ADMIN", "STAFF"),
  DashboardController.staff,
);

export const dashboardRouter = router;
