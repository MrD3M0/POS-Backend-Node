"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRouter = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const isUser_1 = require("@/middlewares/isUser");
const router = (0, express_1.Router)();
router.get("/", isUser_1.isUser, controller_1.NotificationController.index);
exports.notificationRouter = router;
