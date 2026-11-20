import { Router } from "express";
import { FeePaymentMethodLineController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";

const router = Router();

router.get("/", isUser, requirePermission("fees", "read"), FeePaymentMethodLineController.index);
router.get("/:id", isUser, requirePermission("fees", "read"), FeePaymentMethodLineController.retrieve);
router.use((_, res) => res.status(405).json({ success: false, message: "Fee payment method lines cannot be edited or deleted" }));

export const feePaymentMethodLineRouter = router;
