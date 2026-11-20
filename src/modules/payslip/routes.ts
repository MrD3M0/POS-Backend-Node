import { Router } from "express";
import { PayslipController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";

const router = Router();

// Payslips are generated/owned by payroll; admin/principal/accountant may view.
router.get("/", isUser, requirePermission("payroll", "read"), PayslipController.index);
router.post("/", isUser, requirePermission("payroll", "prepare"), PayslipController.create);
router.get("/:id", isUser, requirePermission("payroll", "read"), PayslipController.retrieve);
// No update/delete: payslip has no deletedAt and is system-owned.
router.use((_, res) => res.status(405).json({ success: false, message: "Payslips cannot be edited or deleted" }));

export const payslipRouter = router;
