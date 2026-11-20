import { Router } from "express";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";
import { UserController } from "./controller";

const router = Router();

// User and access management is admin-only (module B).
router.get("/", isUser, requirePermission("users", "read"), UserController.index);
router.post("/", isUser, requirePermission("users", "create"), UserController.create);
router.get("/:id", isUser, requirePermission("users", "read"), UserController.retrieve);
router.patch("/:id", isUser, requirePermission("users", "update"), UserController.update);
router.patch("/:id/password", isUser, requirePermission("users", "update"), UserController.resetPassword);
router.patch("/:id/unlock", isUser, requirePermission("users", "update"), UserController.unlock);
router.post("/:id/link-person", isUser, requirePermission("users", "update"), UserController.linkPerson);
router.post("/:id/unlink-person", isUser, requirePermission("users", "update"), UserController.unlinkPerson);
router.post("/:id/verify-email", isUser, requirePermission("users", "update"), UserController.verifyEmail);
router.patch("/:id/restore", isUser, requirePermission("users", "update"), UserController.restore);
router.delete("/:id", isUser, requirePermission("users", "delete"), UserController.delete);

export const userRouter = router;
