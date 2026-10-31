import { Router } from "express";
import { FeeHeadController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "STAFF"),
  FeeHeadController.index,
);
router.post(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "ACCOUNTANT"),
  FeeHeadController.create,
);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "STAFF"),
  FeeHeadController.retrieve,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "ACCOUNTANT"),
  FeeHeadController.delete,
);

export const feeHeadRouter = router;
