import { Router } from "express";
import { ExamSubjectController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

// Group-level approval list (Batch -> Term -> Subject). One row per exam subject.
router.get(
  "/groups",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER"),
  ExamSubjectController.groups,
);

// Bulk principal actions in one transaction.
router.post(
  "/bulk-review",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  ExamSubjectController.bulkReview,
);
router.post(
  "/bulk-publish",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  ExamSubjectController.publish,
);

// Teacher submits one subject for approval / re-submits after rejection.
router.post(
  "/:id/submit",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER"),
  ExamSubjectController.submit,
);

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
  isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER"),
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
router.patch(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER"),
  ExamSubjectController.update,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER"),
  ExamSubjectController.delete,
);

export const examSubjectRouter = router;
