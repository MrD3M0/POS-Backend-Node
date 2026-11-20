"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingRouter = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const isUser_1 = require("@/middlewares/isUser");
const authorized_1 = require("@/middlewares/authorized");
const router = (0, express_1.Router)();
router.get("/", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL"), controller_1.SettingController.index);
router.post("/", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN"), controller_1.SettingController.create);
// Typed registry view for the settings screen (defaults merged with stored rows).
router.get("/effective", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL"), controller_1.SettingController.effective);
// Public college identity (logo, contacts, affiliation) for ID cards.
// Every signed-in role may read this; it is not configuration.
router.get("/institution", isUser_1.isUser, controller_1.SettingController.institution);
router.get("/key/:key", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL"), controller_1.SettingController.retrieveByKey);
// Upsert by key: settings still at their registry default have no row/id yet.
// The service limits a principal to the "college" group.
router.put("/key/:key", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL"), controller_1.SettingController.upsertByKey);
router.get("/:id", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL"), controller_1.SettingController.retrieve);
router.patch("/:id", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL"), controller_1.SettingController.update);
router.delete("/:id", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN"), controller_1.SettingController.delete);
exports.settingRouter = router;
