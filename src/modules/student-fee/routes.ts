import { Router } from "express";
import { StudentFeeController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get("/", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "STAFF"), StudentFeeController.index);
router.post("/", isUser, isAuthorizedTo("ADMIN", "ACCOUNTANT"), StudentFeeController.create);
router.get("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "STAFF"), StudentFeeController.retrieve);
router.delete("/:id", isUser, isAuthorizedTo("ADMIN", "ACCOUNTANT"), StudentFeeController.delete);

export const studentFeeRouter = router;