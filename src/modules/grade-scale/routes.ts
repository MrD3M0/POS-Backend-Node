import { Router } from "express";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";
import { GradeScaleController } from "./controller";

const router = Router();

router.get("/", isUser, requirePermission("lookups", "read"), GradeScaleController.index);
router.post("/", isUser, requirePermission("lookups", "create"), GradeScaleController.create);
router.post("/seed-default", isUser, requirePermission("lookups", "create"), GradeScaleController.seedDefault);
router.get("/coverage", isUser, requirePermission("lookups", "read"), GradeScaleController.coverage);
router.get("/:id", isUser, requirePermission("lookups", "read"), GradeScaleController.retrieve);
router.patch("/:id", isUser, requirePermission("lookups", "update"), GradeScaleController.update);
router.delete("/:id", isUser, requirePermission("lookups", "delete"), GradeScaleController.delete);

export const gradeScaleRouter = router;
