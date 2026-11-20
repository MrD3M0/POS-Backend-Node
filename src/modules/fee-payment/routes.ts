import { Router } from "express";
import { FeePaymentController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";

const router = Router();

// Receipts are day-to-day accounting work (accountant). Admin may cancel as
// an emergency override (fees.approve), but cannot create receipts.
router.get("/", isUser, requirePermission("fees", "read"), FeePaymentController.index);
router.post("/", isUser, requirePermission("fees", "create"), FeePaymentController.create);
router.get("/:id", isUser, requirePermission("fees", "read"), FeePaymentController.retrieve);
router.post("/:id/cancel", isUser, requirePermission("fees", "approve"), FeePaymentController.cancel);
// No delete: FeePayment has no deletedAt and is append-only/cancellation-only.
router.use((_, res) => res.status(405).json({ success: false, message: "Fee payments cannot be deleted; cancel the receipt instead" }));

export const feePaymentRouter = router;
