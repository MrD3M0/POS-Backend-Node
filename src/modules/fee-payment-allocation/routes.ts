import { Router } from "express";
import { FeePaymentAllocationController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";

const router = Router();

router.get("/", isUser, requirePermission("fees", "read"), FeePaymentAllocationController.index);
router.get("/:id", isUser, requirePermission("fees", "read"), FeePaymentAllocationController.retrieve);
router.use((_, res) => res.status(405).json({ success: false, message: "Fee payment allocations cannot be edited or deleted" }));

export const feePaymentAllocationRouter = router;
