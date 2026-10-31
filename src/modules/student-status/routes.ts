import { Router } from "express";
import { StudentStatusController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF"),
  StudentStatusController.index,
);
router.post(
  "/",
  isUser,
  isAuthorizedTo("ADMIN"),
  StudentStatusController.create,
);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF"),
  StudentStatusController.retrieve,
);
router.patch(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN"),
  StudentStatusController.update,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN"),
  StudentStatusController.delete,
);

export const studentStatusRouter = router;
