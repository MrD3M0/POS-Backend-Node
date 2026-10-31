import { Router } from "express";
import { StaffController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get("/", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL"), StaffController.index);
router.post("/", isUser, isAuthorizedTo("ADMIN"), StaffController.create);
router.get("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL"), StaffController.retrieve);
router.delete("/:id", isUser, isAuthorizedTo("ADMIN"), StaffController.delete);

export const staffRouter = router;