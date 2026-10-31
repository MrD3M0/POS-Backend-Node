import { Router } from "express";
import { SettingController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  SettingController.index,
);
router.post("/", isUser, isAuthorizedTo("ADMIN"), SettingController.create);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  SettingController.retrieve,
);
router.get(
  "/key/:key",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  SettingController.retrieveByKey,
);
router.patch("/:id", isUser, isAuthorizedTo("ADMIN"), SettingController.update);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN"),
  SettingController.delete,
);

export const settingRouter = router;
