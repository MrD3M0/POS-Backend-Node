import { Router } from "express";
import { StudentController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";

const router = Router();

router.get("/", isUser, requirePermission("students", "read"), StudentController.index);
// Bulk actions must be registered before /:id routes.
router.post("/bulk-import", isUser, requirePermission("students", "create"), StudentController.bulkImport);
router.post("/bulk-approve", isUser, requirePermission("students", "approve"), StudentController.bulkApprove);
router.post("/", isUser, requirePermission("students", "create"), StudentController.create);
router.get("/:id/dues", isUser, requirePermission("students", "read"), StudentController.dues);
router.get("/:id", isUser, requirePermission("students", "read"), StudentController.retrieve);
router.post("/:id/approve", isUser, requirePermission("students", "approve"), StudentController.approve);
router.post("/:id/reject", isUser, requirePermission("students", "approve"), StudentController.reject);
router.post("/:id/resubmit", isUser, requirePermission("students", "update"), StudentController.resubmit);
router.post("/:id/change-status", isUser, requirePermission("students", "approve"), StudentController.changeStatus);
router.patch("/:id", isUser, requirePermission("students", "update"), StudentController.update);
router.delete("/:id", isUser, requirePermission("students", "delete"), StudentController.delete);

export const studentRouter = router;
