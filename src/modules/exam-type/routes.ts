import { Router } from "express";
import { ExamTypeController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF"),
  ExamTypeController.index,
);
router.post(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  ExamTypeController.create,
);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF"),
  ExamTypeController.retrieve,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  ExamTypeController.delete,
);

export const examTypeRouter = router;
