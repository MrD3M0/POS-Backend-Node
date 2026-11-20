import { Router } from "express";
import { PayrollController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";

const router = Router();

// Admin may VIEW payroll only. Accountant prepares/submits/pays; Principal approves/rejects.
router.get("/", isUser, requirePermission("payroll", "read"), PayrollController.index);
router.post("/", isUser, requirePermission("payroll", "create"), PayrollController.create);
router.get("/:id", isUser, requirePermission("payroll", "read"), PayrollController.retrieve);
router.patch("/:id", isUser, requirePermission("payroll", "update"), PayrollController.update);
router.post("/:id/regenerate", isUser, requirePermission("payroll", "prepare"), PayrollController.regenerate);
router.post("/:id/submit", isUser, requirePermission("payroll", "prepare"), PayrollController.submit);
router.post("/:id/approve", isUser, requirePermission("payroll", "approve"), PayrollController.approve);
router.post("/:id/reject", isUser, requirePermission("payroll", "approve"), PayrollController.reject);
router.post("/:id/back-to-draft", isUser, requirePermission("payroll", "prepare"), PayrollController.backToDraft);
router.post("/:id/pay", isUser, requirePermission("payroll", "pay"), PayrollController.pay);
router.delete("/:id", isUser, requirePermission("payroll", "delete"), PayrollController.delete);

export const payrollRouter = router;
