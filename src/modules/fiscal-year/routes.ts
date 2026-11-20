import { Router } from "express";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";
import { FiscalYearController } from "./controller";

const router = Router();

router.get("/", isUser, requirePermission("calendar", "read"), FiscalYearController.index);
router.post("/", isUser, requirePermission("calendar", "create"), FiscalYearController.create);
router.get("/:id", isUser, requirePermission("calendar", "read"), FiscalYearController.retrieve);
router.patch("/:id", isUser, requirePermission("calendar", "update"), FiscalYearController.update);
router.post("/:id/set-current", isUser, requirePermission("calendar", "update"), FiscalYearController.setCurrent);
router.get("/:id/close-preview", isUser, requirePermission("calendar", "update"), FiscalYearController.closePreview);
router.post("/:id/close", isUser, requirePermission("calendar", "update"), FiscalYearController.close);
router.delete("/:id", isUser, requirePermission("calendar", "delete"), FiscalYearController.delete);

export const fiscalYearRouter = router;
