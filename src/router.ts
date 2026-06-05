import express, { Router } from "express";
import authRouter from "./modules/auth/routes";
import categoryRouter from "./modules/categories/routes";
import { isUser } from "./middlewares/isUser";

const router: Router = express.Router();

router.use("/auth", authRouter);
router.use("/category",isUser, categoryRouter);

export default router;
