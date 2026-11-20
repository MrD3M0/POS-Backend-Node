import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { ResultController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";

const router = Router();

/**
 * A transition is not one permission: teachers may re-submit a rejected
 * result (PENDING), while only the principal may approve/reject/publish.
 * The old route always required `results:update` (teacher only), which made
 * every principal Approve fail with 403. Map the target status to the right
 * matrix action instead.
 */
const requireTransitionPermission = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const to = (req.body as { to?: string } | undefined)?.to;
  const action =
    to === "APPROVED" || to === "REJECTED"
      ? "approve"
      : to === "PUBLISHED"
        ? "publish"
        : "update";
  return requirePermission("results", action)(req, res, next);
};

// Admin may VIEW results only. Teacher creates/edits marks flow; Principal approves/publishes.
router.get("/", isUser, requirePermission("results", "read"), ResultController.index);
router.post("/", isUser, requirePermission("results", "create"), ResultController.create);
router.post("/exam/:examId/bulk-approve", isUser, requirePermission("results", "approve"), ResultController.bulkApproveExam);
router.post("/:id/transition", isUser, requireTransitionPermission, ResultController.transition);
router.post("/:id/recompute", isUser, requirePermission("results", "update"), ResultController.recompute);
router.get("/:id", isUser, requirePermission("results", "read"), ResultController.retrieve);
router.patch("/:id", isUser, requirePermission("results", "update"), ResultController.update);
router.delete("/:id", isUser, requirePermission("results", "delete"), ResultController.delete);

export const resultRouter = router;
