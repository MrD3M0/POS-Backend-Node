import { Router } from "express";
import { ResultController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get("/", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER", "STAFF"), ResultController.index);
router.post("/", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER"), ResultController.create);
router.get("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER", "STAFF"), ResultController.retrieve);
router.patch("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER"), ResultController.update);
router.delete("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "TEACHER"), ResultController.delete);

export const resultRouter = router;