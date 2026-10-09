import { Router } from "express";
import { AuthController } from "./controller";
import { isAdmin, isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "../../middlewares/authorized";

const authRouter: Router = Router();

authRouter.post("/login", AuthController.login);
authRouter.post(
  "/register",
  isUser,
  isAuthorizedTo("ADMIN"),
  AuthController.register,
);
authRouter.post("/refresh", AuthController.refresh);
authRouter.get("/me", isUser, AuthController.me);
authRouter.get("/logout", isUser, AuthController.logout);
authRouter.get("/test", AuthController.test);
authRouter.get("/db-test", AuthController.dbTest);
export default authRouter;
