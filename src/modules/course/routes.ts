import { Router } from "express";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";
import { CourseController } from "./controller";

const router = Router();

router.get("/", isUser, requirePermission("academic", "read"), CourseController.index);
router.post("/", isUser, requirePermission("academic", "create"), CourseController.create);
router.get("/:id", isUser, requirePermission("academic", "read"), CourseController.retrieve);
router.patch("/:id", isUser, requirePermission("academic", "update"), CourseController.update);
router.delete("/:id", isUser, requirePermission("academic", "delete"), CourseController.delete);

export const courseRouter = router;
