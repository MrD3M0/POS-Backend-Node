import { Router } from "express";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";
import { BatchTermController } from "./controller";

const router = Router();

router.get("/", isUser, requirePermission("academic", "read"), BatchTermController.index);
router.post("/", isUser, requirePermission("academic", "create"), BatchTermController.create);
router.get("/:id", isUser, requirePermission("academic", "read"), BatchTermController.retrieve);
router.patch("/:id", isUser, requirePermission("academic", "update"), BatchTermController.update);
router.delete("/:id", isUser, requirePermission("academic", "delete"), BatchTermController.delete);

export const batchTermRouter = router;
