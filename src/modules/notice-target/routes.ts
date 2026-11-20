import { Router } from "express";
import { NoticeTargetController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";

const router = Router();

router.get("/", isUser, requirePermission("notices", "read"), NoticeTargetController.index);
router.post("/", isUser, requirePermission("notices", "update"), NoticeTargetController.create);
router.get("/:id", isUser, requirePermission("notices", "read"), NoticeTargetController.retrieve);
router.delete("/:id", isUser, requirePermission("notices", "update"), NoticeTargetController.delete);

export const noticeTargetRouter = router;
