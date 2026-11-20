import { Router } from "express";
import { NotificationController } from "./controller";
import { isUser } from "@/middlewares/isUser";

const router = Router();

router.get("/", isUser, NotificationController.index);

export const notificationRouter = router;
