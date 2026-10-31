import { Router } from "express";
import { WorkflowStatusController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF"),
  WorkflowStatusController.index,
);
router.post(
  "/",
  isUser,
  isAuthorizedTo("ADMIN"),
  WorkflowStatusController.create,
);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF"),
  WorkflowStatusController.retrieve,
);
router.patch(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN"),
  WorkflowStatusController.update,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN"),
  WorkflowStatusController.delete,
);

export const workflowStatusRouter = router;
