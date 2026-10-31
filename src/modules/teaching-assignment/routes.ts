import { Router } from "express";
import { TeachingAssignmentController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get("/", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER", "STAFF"), TeachingAssignmentController.index);
router.post("/", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL"), TeachingAssignmentController.create);
router.get("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER", "STAFF"), TeachingAssignmentController.retrieve);
router.delete("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL"), TeachingAssignmentController.delete);

export const teachingAssignmentRouter = router;