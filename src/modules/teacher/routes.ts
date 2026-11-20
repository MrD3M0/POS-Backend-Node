import { Router } from "express";
import { TeacherController } from "./controller";
import { TeacherDashboardController } from "@/modules/teacher-dashboard/controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

// Registered before "/:id" so the dashboard is not treated as a teacher id.
router.get(
  "/dashboard",
  isUser,
  isAuthorizedTo("TEACHER"),
  TeacherDashboardController.index,
);

// One endpoint per dashboard card: each card loads on its own, so a failing
// card never blocks the others.
router.get(
  "/dashboard/stats",
  isUser,
  isAuthorizedTo("TEACHER"),
  TeacherDashboardController.stats,
);
router.get(
  "/dashboard/attendance-trend",
  isUser,
  isAuthorizedTo("TEACHER"),
  TeacherDashboardController.attendanceTrend,
);
router.get(
  "/dashboard/class-attendance",
  isUser,
  isAuthorizedTo("TEACHER"),
  TeacherDashboardController.classAttendance,
);
router.get(
  "/dashboard/today-schedule",
  isUser,
  isAuthorizedTo("TEACHER"),
  TeacherDashboardController.todaySchedule,
);
router.get(
  "/dashboard/week-schedule",
  isUser,
  isAuthorizedTo("TEACHER"),
  TeacherDashboardController.weekSchedule,
);
router.get(
  "/dashboard/exam-batches",
  isUser,
  isAuthorizedTo("TEACHER"),
  TeacherDashboardController.examBatches,
);
router.get(
  "/dashboard/result-distribution",
  isUser,
  isAuthorizedTo("TEACHER"),
  TeacherDashboardController.resultDistribution,
);
router.get(
  "/dashboard/pass-rate",
  isUser,
  isAuthorizedTo("TEACHER"),
  TeacherDashboardController.passRate,
);
router.get(
  "/dashboard/recent-results",
  isUser,
  isAuthorizedTo("TEACHER"),
  TeacherDashboardController.recentResults,
);
router.get(
  "/dashboard/low-attendance",
  isUser,
  isAuthorizedTo("TEACHER"),
  TeacherDashboardController.lowAttendance,
);
router.get(
  "/dashboard/filters",
  isUser,
  isAuthorizedTo("TEACHER"),
  TeacherDashboardController.filters,
);

router.get(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "STAFF"),
  TeacherController.index,
);
router.post("/", isUser, isAuthorizedTo("ADMIN"), TeacherController.create);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "STAFF"),
  TeacherController.retrieve,
);
router.patch(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "TEACHER"),
  TeacherController.update,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN"),
  TeacherController.delete,
);

export const teacherRouter = router;
