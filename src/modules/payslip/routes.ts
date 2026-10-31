import { Router } from "express";
import { PayslipController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get("/", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT"), PayslipController.index);
router.post("/", isUser, isAuthorizedTo("ADMIN", "ACCOUNTANT"), PayslipController.create);
router.get("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT"), PayslipController.retrieve);
router.delete("/:id", isUser, isAuthorizedTo("ADMIN"), PayslipController.delete);

export const payslipRouter = router;