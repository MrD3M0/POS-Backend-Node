import { Router } from "express";
import { ExamController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get(
  "/",
  isUser,
  isAuthorizedTo(
    "ADMIN",
    "PRINCIPAL",
    "ACCOUNTANT",
    "TEACHER",
    "STAFF",
    "STUDENT",
  ),
  ExamController.index,
);
router.post(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  ExamController.create,
);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo(
    "ADMIN",
    "PRINCIPAL",
    "ACCOUNTANT",
    "TEACHER",
    "STAFF",
    "STUDENT",
  ),
  ExamController.retrieve,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  ExamController.delete,
);

export const examRouter = router;
