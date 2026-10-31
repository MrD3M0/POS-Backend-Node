import { Router } from "express";
import { StudentController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get("/", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF"), StudentController.index);
router.post("/", isUser, isAuthorizedTo("ADMIN", "STAFF"), StudentController.create);
router.get("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF"), StudentController.retrieve);
router.patch("/:id", isUser, isAuthorizedTo("ADMIN", "STAFF"), StudentController.update);
router.delete("/:id", isUser, isAuthorizedTo("ADMIN", "STAFF"), StudentController.delete);

export const studentRouter = router;