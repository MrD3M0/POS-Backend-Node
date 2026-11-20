import { Router } from "express";
import { ScholarshipController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

// Schemes
router.get(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT"),
  ScholarshipController.index,
);
router.post(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "ACCOUNTANT"),
  ScholarshipController.create,
);
router.patch(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "ACCOUNTANT"),
  ScholarshipController.update,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "ACCOUNTANT"),
  ScholarshipController.delete,
);

// Grants (the money given to a student)
router.get(
  "/grants",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT"),
  ScholarshipController.listGrants,
);
router.post(
  "/grants",
  isUser,
  isAuthorizedTo("ADMIN", "ACCOUNTANT"),
  ScholarshipController.grant,
);
router.post(
  "/grants/:id/revoke",
  isUser,
  isAuthorizedTo("ADMIN", "ACCOUNTANT"),
  ScholarshipController.revoke,
);

export const scholarshipRouter = router;
