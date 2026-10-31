import { Router } from "express";
import { BatchTermSubjectController } from "./controller";
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
  BatchTermSubjectController.index,
);
router.post(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  BatchTermSubjectController.create,
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
  BatchTermSubjectController.retrieve,
);
router.patch(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  BatchTermSubjectController.update,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  BatchTermSubjectController.delete,
);

export const batchTermSubjectRouter = router;
