import { Router } from "express";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";
import { HolidayController } from "./controller";

const router = Router();

// Everyone signed in can read the calendar (holidays are used by attendance
// and shown to students/staff), writes are admin-only.
router.get("/", isUser, requirePermission("calendar", "read"), HolidayController.index);
router.post("/", isUser, requirePermission("calendar", "create"), HolidayController.create);
router.post("/bulk-import", isUser, requirePermission("calendar", "create"), HolidayController.bulkImport);
router.post("/bulk", isUser, requirePermission("calendar", "create"), HolidayController.bulkCreate);
router.post("/weekly-offs", isUser, requirePermission("calendar", "create"), HolidayController.weeklyOffs);
router.get("/:id", isUser, requirePermission("calendar", "read"), HolidayController.retrieve);
router.patch("/:id", isUser, requirePermission("calendar", "update"), HolidayController.update);
router.patch("/:id/restore", isUser, requirePermission("calendar", "update"), HolidayController.restore);
router.delete("/:id", isUser, requirePermission("calendar", "delete"), HolidayController.delete);

export const holidayRouter = router;
