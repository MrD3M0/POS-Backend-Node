import { Router } from "express";
import { AttendanceSessionController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER", "STAFF"),
  AttendanceSessionController.index,
);
router.post(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "TEACHER"),
  AttendanceSessionController.create,
);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER", "STAFF"),
  AttendanceSessionController.retrieve,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "TEACHER"),
  AttendanceSessionController.delete,
);

export const attendanceSessionRouter = router;
