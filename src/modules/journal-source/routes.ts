import { Router } from "express";
import { JournalSourceController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT"),
  JournalSourceController.index,
);
router.post(
  "/",
  isUser,
  isAuthorizedTo("ADMIN"),
  JournalSourceController.create,
);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT"),
  JournalSourceController.retrieve,
);
router.patch(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN"),
  JournalSourceController.update,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN"),
  JournalSourceController.delete,
);

export const journalSourceRouter = router;
