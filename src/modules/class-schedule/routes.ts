import { Router } from "express";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";
import { ClassScheduleController } from "./controller";

const router = Router();

router.get("/", isUser, requirePermission("classSchedule", "read"), ClassScheduleController.index);
router.post("/", isUser, requirePermission("classSchedule", "create"), ClassScheduleController.create);
router.get("/calendar", isUser, requirePermission("classSchedule", "read"), ClassScheduleController.calendar);
router.get("/teacher/:teacherId/week", isUser, requirePermission("classSchedule", "read"), ClassScheduleController.teacherWeek);
router.get("/batch-term/:batchTermId/week", isUser, requirePermission("classSchedule", "read"), ClassScheduleController.batchTermWeek);
router.get("/:id", isUser, requirePermission("classSchedule", "read"), ClassScheduleController.retrieve);
router.patch("/:id", isUser, requirePermission("classSchedule", "update"), ClassScheduleController.update);
router.delete("/:id", isUser, requirePermission("classSchedule", "delete"), ClassScheduleController.delete);

export const classScheduleRouter = router;