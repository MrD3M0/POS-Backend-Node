import { Router } from "express";
import { SalaryStructureItemController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get("/", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT"), SalaryStructureItemController.index);
router.post("/", isUser, isAuthorizedTo("ADMIN", "ACCOUNTANT"), SalaryStructureItemController.create);
router.get("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT"), SalaryStructureItemController.retrieve);
router.patch("/:id", isUser, isAuthorizedTo("ADMIN", "ACCOUNTANT"), SalaryStructureItemController.update);
router.delete("/:id", isUser, isAuthorizedTo("ADMIN", "ACCOUNTANT"), SalaryStructureItemController.delete);

export const salaryStructureItemRouter = router;