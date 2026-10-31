import { Router } from "express";
import { OtpController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get("/", isUser, isAuthorizedTo("ADMIN"), OtpController.index);
router.post("/", isUser, isAuthorizedTo("ADMIN"), OtpController.create);
router.get("/:id", isUser, isAuthorizedTo("ADMIN"), OtpController.retrieve);
router.delete("/:id", isUser, isAuthorizedTo("ADMIN"), OtpController.delete);

export const otpRouter = router;
