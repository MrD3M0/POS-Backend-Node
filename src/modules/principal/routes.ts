import { Router } from "express";
import { PrincipalController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get("/", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL"), PrincipalController.index);
router.post("/", isUser, isAuthorizedTo("ADMIN"), PrincipalController.create);
router.get("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL"), PrincipalController.retrieve);
router.delete("/:id", isUser, isAuthorizedTo("ADMIN"), PrincipalController.delete);

export const principalRouter = router;