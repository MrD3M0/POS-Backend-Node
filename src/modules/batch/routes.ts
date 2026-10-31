import { Router } from "express";
import { BatchController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get(
  "/",
  isUser,
  isAuthorizedTo(
    "ADMIN",
    "PRINCIPAL",
    "ACCOUNTANT",
    "TEACHER",
    "STAFF",
    "STUDENT",
  ),
  BatchController.index,
);
router.post(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  BatchController.create,
);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo(
    "ADMIN",
    "PRINCIPAL",
    "ACCOUNTANT",
    "TEACHER",
    "STAFF",
    "STUDENT",
  ),
  BatchController.retrieve,
);
router.patch(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  BatchController.update,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  BatchController.delete,
);

export const batchRouter = router;
