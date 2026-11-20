import { Router } from "express";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";
import { AdminDashboardController } from "./controller";

const router = Router();

router.get("/dashboard", isUser, requirePermission("dashboard", "read"), AdminDashboardController.overview);
router.get("/health", isUser, requirePermission("dashboard", "read"), AdminDashboardController.health);

export const adminRouter = router;
