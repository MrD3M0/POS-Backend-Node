import { Router } from "express";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";
import { BatchController } from "./controller";

const router = Router();

router.get("/", isUser, requirePermission("academic", "read"), BatchController.index);
router.post("/", isUser, requirePermission("academic", "create"), BatchController.create);
router.post("/:id/promote", isUser, requirePermission("academic", "update"), BatchController.promote);
router.post("/:id/graduate", isUser, requirePermission("academic", "update"), BatchController.graduate);
router.get("/:id", isUser, requirePermission("academic", "read"), BatchController.retrieve);
router.patch("/:id", isUser, requirePermission("academic", "update"), BatchController.update);
router.delete("/:id", isUser, requirePermission("academic", "delete"), BatchController.delete);

export const batchRouter = router;
