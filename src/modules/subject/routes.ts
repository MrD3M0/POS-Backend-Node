import { Router } from "express";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";
import { SubjectController } from "./controller";

const router = Router();

router.get("/", isUser, requirePermission("academic", "read"), SubjectController.index);
router.post("/", isUser, requirePermission("academic", "create"), SubjectController.create);
router.get("/:id", isUser, requirePermission("academic", "read"), SubjectController.retrieve);
router.patch("/:id", isUser, requirePermission("academic", "update"), SubjectController.update);
router.delete("/:id", isUser, requirePermission("academic", "delete"), SubjectController.delete);

export const subjectRouter = router;
