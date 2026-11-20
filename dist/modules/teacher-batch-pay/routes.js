"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherBatchPayRouter = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const isUser_1 = require("@/middlewares/isUser");
const authorized_1 = require("@/middlewares/authorized");
const router = (0, express_1.Router)();
router.get("/", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER"), controller_1.TeacherBatchPayController.index);
// Only ADMIN and ACCOUNTANT may set up a batch pay. A teacher may only READ
// their own rows (the index/retrieve handlers scope them to their records).
router.post("/", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "ACCOUNTANT"), controller_1.TeacherBatchPayController.create);
router.get("/:id", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER"), controller_1.TeacherBatchPayController.retrieve);
router.patch("/:id", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "ACCOUNTANT"), controller_1.TeacherBatchPayController.update);
router.delete("/:id", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "ACCOUNTANT"), controller_1.TeacherBatchPayController.delete);
exports.teacherBatchPayRouter = router;
