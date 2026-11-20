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
// Typed registry view for the settings screen (defaults merged with stored rows).
router.get(
  "/effective",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  SettingController.effective,
);
// Public college identity (logo, contacts, affiliation) for ID cards.
// Every signed-in role may read this; it is not configuration.
router.get("/institution", isUser, SettingController.institution);
router.get(
  "/key/:key",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  SettingController.retrieveByKey,
);
// Upsert by key: settings still at their registry default have no row/id yet.
// The service limits a principal to the "college" group.
router.put(
  "/key/:key",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  SettingController.upsertByKey,
);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  SettingController.retrieve,
);
router.patch(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  SettingController.update,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN"),
  SettingController.delete,
);

export const settingRouter = router;
