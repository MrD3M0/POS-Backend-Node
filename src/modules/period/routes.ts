import { Router } from "express";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";
import { PeriodController } from "./controller";

const router = Router();

router.get("/", isUser, requirePermission("lookups", "read"), PeriodController.index);
router.post("/", isUser, requirePermission("lookups", "create"), PeriodController.create);
router.get("/:id", isUser, requirePermission("lookups", "read"), PeriodController.retrieve);
router.patch("/:id", isUser, requirePermission("lookups", "update"), PeriodController.update);
router.delete("/:id", isUser, requirePermission("lookups", "delete"), PeriodController.delete);

export const periodRouter = router;
