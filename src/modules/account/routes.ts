import { Router } from "express";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";
import { AccountController } from "./controller";

const router = Router();

router.get("/", isUser, requirePermission("accounts", "read"), AccountController.index);
router.get("/tree", isUser, requirePermission("accounts", "read"), AccountController.tree);
router.post("/", isUser, requirePermission("accounts", "create"), AccountController.create);
router.post("/seed-default", isUser, requirePermission("accounts", "create"), AccountController.seedDefault);
router.get("/:id", isUser, requirePermission("accounts", "read"), AccountController.retrieve);
router.patch("/:id", isUser, requirePermission("accounts", "update"), AccountController.update);
router.delete("/:id", isUser, requirePermission("accounts", "delete"), AccountController.delete);

export const accountRouter = router;
