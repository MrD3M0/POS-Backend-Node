import { Router } from "express";
import { StudentFeeItemController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { isAuthorizedTo } from "@/middlewares/authorized";

const router = Router();

router.get("/", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "STAFF"), StudentFeeItemController.index);
router.post("/", isUser, isAuthorizedTo("ADMIN", "ACCOUNTANT"), StudentFeeItemController.create);
router.get("/:id", isUser, isAuthorizedTo("ADMIN", "PRINCIPAL", "ACCOUNTANT", "STAFF"), StudentFeeItemController.retrieve);
router.delete("/:id", isUser, isAuthorizedTo("ADMIN", "ACCOUNTANT"), StudentFeeItemController.delete);

export const studentFeeItemRouter = router;