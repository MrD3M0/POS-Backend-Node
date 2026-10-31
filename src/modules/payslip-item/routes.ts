import { Router } from "express";
import { PayslipItemController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT"),
  PayslipItemController.index,
);
router.post(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "ACCOUNTANT"),
  PayslipItemController.create,
);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT"),
  PayslipItemController.retrieve,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN"),
  PayslipItemController.delete,
);

export const payslipItemRouter = router;
