import { Router } from "express";
import { StaffController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get("/", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL"), StaffController.index);
router.post("/", isUser, isAuthorizedTo("ADMIN"), StaffController.create);
router.get("/me", isUser, isAuthorizedTo("STAFF"), StaffController.me);
router.get("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "STAFF"), StaffController.retrieve);
router.patch("/:id", isUser, isAuthorizedTo("ADMIN", "STAFF"), StaffController.update);
router.delete("/:id", isUser, isAuthorizedTo("ADMIN"), StaffController.delete);

export const staffRouter = router;