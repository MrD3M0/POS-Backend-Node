import { Router } from "express";
import { NoticeController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";

const router = Router();

router.get("/", isUser, requirePermission("notices", "read"), NoticeController.index);
router.post("/", isUser, requirePermission("notices", "create"), NoticeController.create);
router.get("/:id/preview-audience", isUser, requirePermission("notices", "read"), NoticeController.previewAudience);
router.get("/:id", isUser, requirePermission("notices", "read"), NoticeController.retrieve);
router.patch("/:id", isUser, requirePermission("notices", "update"), NoticeController.update);
router.post("/:id/publish", isUser, requirePermission("notices", "publish"), NoticeController.publish);
router.post("/:id/unpublish", isUser, requirePermission("notices", "publish"), NoticeController.unpublish);
router.delete("/:id", isUser, requirePermission("notices", "delete"), NoticeController.delete);

export const noticeRouter = router;
