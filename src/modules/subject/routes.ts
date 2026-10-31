import { Router } from "express";
import { SubjectController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get("/", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF", "STUDENT"), SubjectController.index);
router.post("/", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL"), SubjectController.create);
router.get("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF", "STUDENT"), SubjectController.retrieve);
router.patch("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL"), SubjectController.update);
router.delete("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL"), SubjectController.delete);

export const subjectRouter = router;