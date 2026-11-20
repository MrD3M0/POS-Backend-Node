import { Router } from "express";
import { PayslipItemController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";

const router = Router();

router.get("/", isUser, requirePermission("payroll", "read"), PayslipItemController.index);
router.get("/:id", isUser, requirePermission("payroll", "read"), PayslipItemController.retrieve);
router.use((_, res) => res.status(405).json({ success: false, message: "Payslip items cannot be edited or deleted" }));

export const payslipItemRouter = router;
