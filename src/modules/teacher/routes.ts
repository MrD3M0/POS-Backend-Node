import { Router } from "express";
import { TeacherController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get("/", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "STAFF"), TeacherController.index);
router.post("/", isUser, isAuthorizedTo("ADMIN"), TeacherController.create);
router.get("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "STAFF"), TeacherController.retrieve);
router.delete("/:id", isUser, isAuthorizedTo("ADMIN"), TeacherController.delete);

export const teacherRouter = router;