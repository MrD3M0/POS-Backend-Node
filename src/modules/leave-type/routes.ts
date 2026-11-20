import { Router } from "express";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";
import { LeaveTypeController } from "./controller";

const router = Router();

router.get("/", isUser, requirePermission("lookups", "read"), LeaveTypeController.index);
router.post("/", isUser, requirePermission("lookups", "create"), LeaveTypeController.create);
router.get("/:id", isUser, requirePermission("lookups", "read"), LeaveTypeController.retrieve);
router.patch("/:id", isUser, requirePermission("lookups", "update"), LeaveTypeController.update);
router.delete("/:id", isUser, requirePermission("lookups", "delete"), LeaveTypeController.delete);

export const leaveTypeRouter = router;
