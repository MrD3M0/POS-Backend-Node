import { Router } from "express";
import { FeePaymentMethodLineController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT"),
  FeePaymentMethodLineController.index,
);
router.post(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "ACCOUNTANT"),
  FeePaymentMethodLineController.create,
);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT"),
  FeePaymentMethodLineController.retrieve,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN"),
  FeePaymentMethodLineController.delete,
);

export const feePaymentMethodLineRouter = router;
