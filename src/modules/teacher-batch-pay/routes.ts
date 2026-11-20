import { Router } from "express";
import { TeacherBatchPayController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER"),
  TeacherBatchPayController.index,
);
// Only ADMIN and ACCOUNTANT may set up a batch pay. A teacher may only READ
// their own rows (the index/retrieve handlers scope them to their records).
router.post(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "ACCOUNTANT"),
  TeacherBatchPayController.create,
);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER"),
  TeacherBatchPayController.retrieve,
);
router.patch(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "ACCOUNTANT"),
  TeacherBatchPayController.update,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "ACCOUNTANT"),
  TeacherBatchPayController.delete,
);

export const teacherBatchPayRouter = router;
