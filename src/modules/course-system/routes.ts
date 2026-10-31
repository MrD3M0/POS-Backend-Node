import { Router } from "express";
import { CourseSystemController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get(
  "/",
  isUser,
  isAuthorizedTo(
    "ADMIN",
    "PRINCIPAL",
    "ACCOUNTANT",
    "TEACHER",
    "STAFF",
    "STUDENT",
  ),
  CourseSystemController.index,
);
router.post(
  "/",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  CourseSystemController.create,
);
router.get(
  "/:id",
  isUser,
  isAuthorizedTo(
    "ADMIN",
    "PRINCIPAL",
    "ACCOUNTANT",
    "TEACHER",
    "STAFF",
    "STUDENT",
  ),
  CourseSystemController.retrieve,
);
router.patch(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  CourseSystemController.update,
);
router.delete(
  "/:id",
  isUser,
  isAuthorizedTo("ADMIN", "PRINCIPAL"),
  CourseSystemController.delete,
);

export const courseSystemRouter = router;
