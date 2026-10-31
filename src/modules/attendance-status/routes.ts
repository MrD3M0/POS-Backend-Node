import { Router } from "express";
import { AttendanceStatusController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF"),
  AttendanceStatusController.index,
);
router.post(
  "/",
  isUser,
  isAuthorizedTo("ADMIN"),
  AttendanceStatusController.create,
);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF"),
  AttendanceStatusController.retrieve,
);
router.patch(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN"),
  AttendanceStatusController.update,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN"),
  AttendanceStatusController.delete,
);

export const attendanceStatusRouter = router;
