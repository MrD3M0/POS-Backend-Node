import { Router } from "express";
import { StudentAttendanceController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

// Students can read only their own records (enforced in the service)
const canRead = isAuthorizedTo(
  "ADMIN",
  "PRINCIPAL",
  "TEACHER",
  "STAFF",
  "STUDENT",
);
// Teachers can write only to their own sessions (enforced in the service)
const canWrite = isAuthorizedTo("ADMIN", "TEACHER");

router.get("/", isUser, canRead, StudentAttendanceController.index);
router.post("/", isUser, canWrite, StudentAttendanceController.create);
router.post("/bulk", isUser, canWrite, StudentAttendanceController.bulkMark);
router.get(
  "/student/:studentId/summary",
  isUser,
  canRead,
  StudentAttendanceController.summary,
);
router.get("/:id", isUser, canRead, StudentAttendanceController.retrieve);
router.patch("/:id", isUser, canWrite, StudentAttendanceController.update);
router.delete("/:id", isUser, canWrite, StudentAttendanceController.delete);

export const studentAttendanceRouter = router;
