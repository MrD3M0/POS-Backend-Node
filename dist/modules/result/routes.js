"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resultRouter = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const isUser_1 = require("@/middlewares/isUser");
const permission_1 = require("@/middlewares/permission");
const router = (0, express_1.Router)();
/**
 * A transition is not one permission: teachers may re-submit a rejected
 * result (PENDING), while only the principal may approve/reject/publish.
 * The old route always required `results:update` (teacher only), which made
 * every principal Approve fail with 403. Map the target status to the right
 * matrix action instead.
 */
const requireTransitionPermission = (req, res, next) => {
    const to = req.body?.to;
    const action = to === "APPROVED" || to === "REJECTED"
        ? "approve"
        : to === "PUBLISHED"
            ? "publish"
            : "update";
    return (0, permission_1.requirePermission)("results", action)(req, res, next);
};
// Admin may VIEW results only. Teacher creates/edits marks flow; Principal approves/publishes.
router.get("/", isUser_1.isUser, (0, permission_1.requirePermission)("results", "read"), controller_1.ResultController.index);
router.post("/", isUser_1.isUser, (0, permission_1.requirePermission)("results", "create"), controller_1.ResultController.create);
router.post("/exam/:examId/bulk-approve", isUser_1.isUser, (0, permission_1.requirePermission)("results", "approve"), controller_1.ResultController.bulkApproveExam);
router.post("/:id/transition", isUser_1.isUser, requireTransitionPermission, controller_1.ResultController.transition);
router.post("/:id/recompute", isUser_1.isUser, (0, permission_1.requirePermission)("results", "update"), controller_1.ResultController.recompute);
router.get("/:id", isUser_1.isUser, (0, permission_1.requirePermission)("results", "read"), controller_1.ResultController.retrieve);
router.patch("/:id", isUser_1.isUser, (0, permission_1.requirePermission)("results", "update"), controller_1.ResultController.update);
router.delete("/:id", isUser_1.isUser, (0, permission_1.requirePermission)("results", "delete"), controller_1.ResultController.delete);
exports.resultRouter = router;
