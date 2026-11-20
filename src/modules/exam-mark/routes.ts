import { Router } from "express";
import { ExamMarkController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER"),
  ExamMarkController.index,
);
router.post(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "TEACHER"),
  ExamMarkController.create,
);
router.post(
  "/bulk",
  isUser,
  isAuthorizedTo("ADMIN", "TEACHER"),
  ExamMarkController.bulkCreate,
);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER"),
  ExamMarkController.retrieve,
);
router.patch(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "TEACHER"),
  ExamMarkController.update,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "TEACHER"),
  ExamMarkController.delete,
);

export const examMarkRouter = router;
