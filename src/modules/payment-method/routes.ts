import { Router } from "express";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";
import { PaymentMethodController } from "./controller";

const router = Router();

router.get("/", isUser, requirePermission("lookups", "read"), PaymentMethodController.index);
router.post("/", isUser, requirePermission("lookups", "create"), PaymentMethodController.create);
router.get("/:id", isUser, requirePermission("lookups", "read"), PaymentMethodController.retrieve);
router.patch("/:id", isUser, requirePermission("lookups", "update"), PaymentMethodController.update);
router.delete("/:id", isUser, requirePermission("lookups", "delete"), PaymentMethodController.delete);

export const paymentMethodRouter = router;
