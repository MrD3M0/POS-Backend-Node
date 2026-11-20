import { Router } from "express";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";
import { SalaryComponentController } from "./controller";

const router = Router();

router.get("/", isUser, requirePermission("lookups", "read"), SalaryComponentController.index);
router.post("/", isUser, requirePermission("lookups", "create"), SalaryComponentController.create);
router.get("/:id", isUser, requirePermission("lookups", "read"), SalaryComponentController.retrieve);
router.patch("/:id", isUser, requirePermission("lookups", "update"), SalaryComponentController.update);
router.delete("/:id", isUser, requirePermission("lookups", "delete"), SalaryComponentController.delete);

export const salaryComponentRouter = router;
