import { Router } from "express";
import { UserController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

// Account management is an admin-only area
router.get("/", isUser, isAuthorizedTo("ADMIN"), UserController.index);
router.post("/", isUser, isAuthorizedTo("ADMIN"), UserController.create);
router.get("/:id", isUser, isAuthorizedTo("ADMIN"), UserController.retrieve);
router.patch("/:id", isUser, isAuthorizedTo("ADMIN"), UserController.update);
router.patch(
  "/:id/password",
  isUser,
  isAuthorizedTo("ADMIN"),
  UserController.resetPassword,
);
router.patch(
  "/:id/unlock",
  isUser,
  isAuthorizedTo("ADMIN"),
  UserController.unlock,
);
router.delete("/:id", isUser, isAuthorizedTo("ADMIN"), UserController.delete);

export const userRouter = router;
