import express, { Router } from "express";
import authRouter from "./modules/auth/routes";
import { batchRouter } from "./modules/batch/routes";

const router: Router = express.Router();

router.use("/auth", authRouter);
router.use("/batch", batchRouter);


export default router;
