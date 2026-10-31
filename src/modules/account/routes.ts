import { Router } from "express";
import { AccountController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT"),
  AccountController.index,
);
router.post(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "ACCOUNTANT"),
  AccountController.create,
);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT"),
  AccountController.retrieve,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "ACCOUNTANT"),
  AccountController.delete,
);

export const accountRouter = router;
