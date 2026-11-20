"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.examSubjectRouter = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const isUser_1 = require("@/middlewares/isUser");
const authorized_1 = require("@/middlewares/authorized");
const router = (0, express_1.Router)();
// Group-level approval list (Batch -> Term -> Subject). One row per exam subject.
router.get("/groups", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL", "TEACHER"), controller_1.ExamSubjectController.groups);
// Bulk principal actions in one transaction.
router.post("/bulk-review", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL"), controller_1.ExamSubjectController.bulkReview);
router.post("/bulk-publish", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL"), controller_1.ExamSubjectController.publish);
// Teacher submits one subject for approval / re-submits after rejection.
router.post("/:id/submit", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL", "TEACHER"), controller_1.ExamSubjectController.submit);
router.get("/", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF", "STUDENT"), controller_1.ExamSubjectController.index);
router.post("/", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL", "TEACHER"), controller_1.ExamSubjectController.create);
router.get("/:id", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF", "STUDENT"), controller_1.ExamSubjectController.retrieve);
router.patch("/:id", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL", "TEACHER"), controller_1.ExamSubjectController.update);
router.delete("/:id", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL", "TEACHER"), controller_1.ExamSubjectController.delete);
exports.examSubjectRouter = router;
