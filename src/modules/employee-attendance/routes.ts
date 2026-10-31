import { Router } from "express";
import { EmployeeAttendanceController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "STAFF"),
  EmployeeAttendanceController.index,
);
router.post(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "STAFF"),
  EmployeeAttendanceController.create,
);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "STAFF"),
  EmployeeAttendanceController.retrieve,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "STAFF"),
  EmployeeAttendanceController.delete,
);

export const employeeAttendanceRouter = router;
