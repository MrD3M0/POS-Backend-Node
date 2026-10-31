import { Router } from "express";
import { SalaryStructureController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get("/", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT"), SalaryStructureController.index);
router.post("/", isUser, isAuthorizedTo("ADMIN", "ACCOUNTANT"), SalaryStructureController.create);
router.get("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT"), SalaryStructureController.retrieve);
router.patch("/:id", isUser, isAuthorizedTo("ADMIN", "ACCOUNTANT"), SalaryStructureController.update);
router.delete("/:id", isUser, isAuthorizedTo("ADMIN", "ACCOUNTANT"), SalaryStructureController.delete);

export const salaryStructureRouter = router;