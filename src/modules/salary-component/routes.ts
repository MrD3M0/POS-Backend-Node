import { Router } from "express";
import { SalaryComponentController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get("/", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT"), SalaryComponentController.index);
router.post("/", isUser, isAuthorizedTo("ADMIN", "ACCOUNTANT"), SalaryComponentController.create);
router.get("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT"), SalaryComponentController.retrieve);
router.patch("/:id", isUser, isAuthorizedTo("ADMIN", "ACCOUNTANT"), SalaryComponentController.update);
router.delete("/:id", isUser, isAuthorizedTo("ADMIN", "ACCOUNTANT"), SalaryComponentController.delete);

export const salaryComponentRouter = router;