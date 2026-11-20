import { Router } from "express";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";
import { FeeHeadController } from "./controller";

const router = Router();

router.get("/", isUser, requirePermission("lookups", "read"), FeeHeadController.index);
router.post("/", isUser, requirePermission("lookups", "create"), FeeHeadController.create);
router.get("/:id", isUser, requirePermission("lookups", "read"), FeeHeadController.retrieve);
router.patch("/:id", isUser, requirePermission("lookups", "update"), FeeHeadController.update);
router.delete("/:id", isUser, requirePermission("lookups", "delete"), FeeHeadController.delete);

export const feeHeadRouter = router;
