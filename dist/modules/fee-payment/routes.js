"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feePaymentRouter = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const isUser_1 = require("@/middlewares/isUser");
const permission_1 = require("@/middlewares/permission");
const router = (0, express_1.Router)();
// Receipts are day-to-day accounting work (accountant). Admin may cancel as
// an emergency override (fees.approve), but cannot create receipts.
router.get("/", isUser_1.isUser, (0, permission_1.requirePermission)("fees", "read"), controller_1.FeePaymentController.index);
router.post("/", isUser_1.isUser, (0, permission_1.requirePermission)("fees", "create"), controller_1.FeePaymentController.create);
router.get("/:id", isUser_1.isUser, (0, permission_1.requirePermission)("fees", "read"), controller_1.FeePaymentController.retrieve);
router.post("/:id/cancel", isUser_1.isUser, (0, permission_1.requirePermission)("fees", "approve"), controller_1.FeePaymentController.cancel);
// No delete: FeePayment has no deletedAt and is append-only/cancellation-only.
router.use((_, res) => res.status(405).json({ success: false, message: "Fee payments cannot be deleted; cancel the receipt instead" }));
exports.feePaymentRouter = router;
