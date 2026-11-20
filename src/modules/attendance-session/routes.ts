import { Router } from "express";
import { AttendanceSessionController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";

const router = Router();

router.get("/", isUser, requirePermission("studentAttendance", "read"), AttendanceSessionController.index);
router.post("/", isUser, requirePermission("studentAttendance", "create"), AttendanceSessionController.create);
router.get("/:id/roster", isUser, requirePermission("studentAttendance", "read"), AttendanceSessionController.roster);
router.post("/:id/unlock", isUser, requirePermission("studentAttendance", "unlock"), AttendanceSessionController.unlock);
router.get("/:id", isUser, requirePermission("studentAttendance", "read"), AttendanceSessionController.retrieve);
router.patch("/:id", isUser, requirePermission("studentAttendance", "update"), AttendanceSessionController.update);
router.delete("/:id", isUser, requirePermission("studentAttendance", "delete"), AttendanceSessionController.delete);

export const attendanceSessionRouter = router;
