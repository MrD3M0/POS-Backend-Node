import { Router } from "express";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";
import { AuditLogController } from "./controller";

const router = Router();

// Read-only by design: no POST/PATCH/DELETE routes exist for audit rows.
router.get("/", isUser, requirePermission("audit", "read"), AuditLogController.index);
router.get("/options", isUser, requirePermission("audit", "read"), AuditLogController.options);
router.get("/:id", isUser, requirePermission("audit", "read"), AuditLogController.retrieve);

export const auditLogRouter = router;
