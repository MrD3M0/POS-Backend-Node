import { Router } from "express";
import { AccountantController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  AccountantController.index,
);
router.post("/", isUser, isAuthorizedTo("ADMIN"), AccountantController.create);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  AccountantController.retrieve,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN"),
  AccountantController.delete,
);

export const accountantRouter = router;
