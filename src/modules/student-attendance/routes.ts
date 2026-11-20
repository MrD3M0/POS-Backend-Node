import { Router } from "express";
import { StudentAttendanceController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";

const router = Router();

router.get("/", isUser, requirePermission("studentAttendance", "read"), StudentAttendanceController.index);
router.post("/", isUser, requirePermission("studentAttendance", "create"), StudentAttendanceController.create);
router.post("/bulk", isUser, requirePermission("studentAttendance", "create"), StudentAttendanceController.bulkMark);
router.get(
  "/student/:studentId/summary",
  isUser,
  requirePermission("studentAttendance", "read"),
  StudentAttendanceController.summary,
);
router.get("/:id", isUser, requirePermission("studentAttendance", "read"), StudentAttendanceController.retrieve);
router.patch("/:id", isUser, requirePermission("studentAttendance", "update"), StudentAttendanceController.update);
router.delete("/:id", isUser, requirePermission("studentAttendance", "delete"), StudentAttendanceController.delete);

export const studentAttendanceRouter = router;
