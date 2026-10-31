import { Router } from "express";
import { ExamSubjectController } from "./controller";
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
  ExamSubjectController.index,
);
router.post(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  ExamSubjectController.create,
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
  ExamSubjectController.retrieve,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  ExamSubjectController.delete,
);

export const examSubjectRouter = router;
