"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teachingAssignmentRouter = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const isUser_1 = require("@/middlewares/isUser");
const authorized_1 = require("@/middlewares/authorized");
const router = (0, express_1.Router)();
router.get("/", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL", "TEACHER", "STAFF"), controller_1.TeachingAssignmentController.index);
router.post("/", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL"), controller_1.TeachingAssignmentController.create);
// Workload (subjects assigned + weekly periods) — used by the assignment form.
router.get("/workload/:teacherId", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL"), controller_1.TeachingAssignmentController.workload);
router.get("/:id", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL", "TEACHER", "STAFF"), controller_1.TeachingAssignmentController.retrieve);
router.patch("/:id", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL", "TEACHER"), controller_1.TeachingAssignmentController.update);
router.delete("/:id", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL"), controller_1.TeachingAssignmentController.delete);
exports.teachingAssignmentRouter = router;
