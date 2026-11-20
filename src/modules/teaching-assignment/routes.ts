import { Router } from "express";
import { TeachingAssignmentController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get("/", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER", "STAFF"), TeachingAssignmentController.index);
router.post("/", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL"), TeachingAssignmentController.create);
// Workload (subjects assigned + weekly periods) — used by the assignment form.
router.get("/workload/:teacherId", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL"), TeachingAssignmentController.workload);
router.get("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER", "STAFF"), TeachingAssignmentController.retrieve);
router.patch("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER"), TeachingAssignmentController.update);
router.delete("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL"), TeachingAssignmentController.delete);

export const teachingAssignmentRouter = router;