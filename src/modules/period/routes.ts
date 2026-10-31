import { Router } from "express";
import { PeriodController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get("/", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF"), PeriodController.index);
router.post("/", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL"), PeriodController.create);
router.get("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF"), PeriodController.retrieve);
router.patch("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL"), PeriodController.update);
router.delete("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL"), PeriodController.delete);

export const periodRouter = router;