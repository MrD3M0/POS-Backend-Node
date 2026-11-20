import { Router } from "express";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";
import { ExamTypeController } from "./controller";

const router = Router();

router.get("/", isUser, requirePermission("lookups", "read"), ExamTypeController.index);
router.post("/", isUser, requirePermission("lookups", "create"), ExamTypeController.create);
router.get("/:id", isUser, requirePermission("lookups", "read"), ExamTypeController.retrieve);
router.patch("/:id", isUser, requirePermission("lookups", "update"), ExamTypeController.update);
router.delete("/:id", isUser, requirePermission("lookups", "delete"), ExamTypeController.delete);

export const examTypeRouter = router;
