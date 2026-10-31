import { Router } from "express";
import { ResultSubjectController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER", "STAFF"),
  ResultSubjectController.index,
);
router.post(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER"),
  ResultSubjectController.create,
);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER", "STAFF"),
  ResultSubjectController.retrieve,
);
router.patch(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER"),
  ResultSubjectController.update,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER"),
  ResultSubjectController.delete,
);

export const resultSubjectRouter = router;
