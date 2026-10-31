import { Router } from "express";
import { LeaveTypeController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF"),
  LeaveTypeController.index,
);
router.post("/", isUser, isAuthorizedTo("ADMIN"), LeaveTypeController.create);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF"),
  LeaveTypeController.retrieve,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN"),
  LeaveTypeController.delete,
);

export const leaveTypeRouter = router;
