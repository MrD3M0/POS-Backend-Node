import { Router } from "express";
import { BatchController } from "./controller";
import { isUser } from "@/middlewares/isUser";

const router = Router();

router.get("/", isUser, BatchController.index);
router.post("/", isUser, BatchController.create);
router.get("/:id", isUser, BatchController.retrieve);
router.patch("/:id", isUser, BatchController.update);
router.delete("/:id", isUser, BatchController.delete);

export const batchRouter = router;
