import { Router } from "express";
import { TaxSlabController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT"),
  TaxSlabController.index,
);
router.post(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "ACCOUNTANT"),
  TaxSlabController.create,
);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT"),
  TaxSlabController.retrieve,
);
router.patch(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "ACCOUNTANT"),
  TaxSlabController.update,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "ACCOUNTANT"),
  TaxSlabController.delete,
);

export const taxSlabRouter = router;
