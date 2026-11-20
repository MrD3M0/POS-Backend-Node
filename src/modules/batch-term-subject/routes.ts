import { Router } from "express";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";
import { BatchTermSubjectController } from "./controller";

const router = Router();

router.get("/", isUser, requirePermission("academic", "read"), BatchTermSubjectController.index);
router.post("/", isUser, requirePermission("academic", "create"), BatchTermSubjectController.create);
router.post("/bulk", isUser, requirePermission("academic", "create"), BatchTermSubjectController.bulkCreate);
router.post("/copy", isUser, requirePermission("academic", "create"), BatchTermSubjectController.copy);
router.get("/:id", isUser, requirePermission("academic", "read"), BatchTermSubjectController.retrieve);
router.patch("/:id", isUser, requirePermission("academic", "update"), BatchTermSubjectController.update);
router.delete("/:id", isUser, requirePermission("academic", "delete"), BatchTermSubjectController.delete);

export const batchTermSubjectRouter = router;
