import { Router } from "express";
import { AuthController } from "./controller";
import { isUser } from "@/middlewares/isUser";

const authRouter: Router = Router();

authRouter.post("/login", AuthController.login);
authRouter.post("/register", AuthController.register);
authRouter.get("/me", isUser, AuthController.me);

export default authRouter;
