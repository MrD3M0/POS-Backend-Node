import { Router } from "express";
import { EmployeeAttendanceController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";

const router = Router();

// Matrix: admin reads, principal creates/updates, accountant reads.
router.get("/", isUser, requirePermission("employeeAttendance", "read"), EmployeeAttendanceController.index);
router.post("/bulk", isUser, requirePermission("employeeAttendance", "create"), EmployeeAttendanceController.bulkMark);
router.post("/", isUser, requirePermission("employeeAttendance", "create"), EmployeeAttendanceController.create);
router.get("/:id", isUser, requirePermission("employeeAttendance", "read"), EmployeeAttendanceController.retrieve);
router.patch("/:id", isUser, requirePermission("employeeAttendance", "update"), EmployeeAttendanceController.update);
router.delete("/:id", isUser, requirePermission("employeeAttendance", "delete"), EmployeeAttendanceController.delete);

export const employeeAttendanceRouter = router;
