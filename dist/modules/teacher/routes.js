"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherRouter = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const controller_2 = require("@/modules/teacher-dashboard/controller");
const isUser_1 = require("@/middlewares/isUser");
const authorized_1 = require("@/middlewares/authorized");
const router = (0, express_1.Router)();
// Registered before "/:id" so the dashboard is not treated as a teacher id.
router.get("/dashboard", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("TEACHER"), controller_2.TeacherDashboardController.index);
// One endpoint per dashboard card: each card loads on its own, so a failing
// card never blocks the others.
router.get("/dashboard/stats", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("TEACHER"), controller_2.TeacherDashboardController.stats);
router.get("/dashboard/attendance-trend", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("TEACHER"), controller_2.TeacherDashboardController.attendanceTrend);
router.get("/dashboard/class-attendance", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("TEACHER"), controller_2.TeacherDashboardController.classAttendance);
router.get("/dashboard/today-schedule", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("TEACHER"), controller_2.TeacherDashboardController.todaySchedule);
router.get("/dashboard/week-schedule", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("TEACHER"), controller_2.TeacherDashboardController.weekSchedule);
router.get("/dashboard/exam-batches", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("TEACHER"), controller_2.TeacherDashboardController.examBatches);
router.get("/dashboard/result-distribution", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("TEACHER"), controller_2.TeacherDashboardController.resultDistribution);
router.get("/dashboard/pass-rate", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("TEACHER"), controller_2.TeacherDashboardController.passRate);
router.get("/dashboard/recent-results", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("TEACHER"), controller_2.TeacherDashboardController.recentResults);
router.get("/dashboard/low-attendance", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("TEACHER"), controller_2.TeacherDashboardController.lowAttendance);
router.get("/dashboard/filters", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("TEACHER"), controller_2.TeacherDashboardController.filters);
router.get("/", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL", "ACCOUNTANT", "STAFF"), controller_1.TeacherController.index);
router.post("/", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN"), controller_1.TeacherController.create);
router.get("/:id", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL", "ACCOUNTANT", "STAFF"), controller_1.TeacherController.retrieve);
router.patch("/:id", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "TEACHER"), controller_1.TeacherController.update);
router.delete("/:id", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN"), controller_1.TeacherController.delete);
exports.teacherRouter = router;
