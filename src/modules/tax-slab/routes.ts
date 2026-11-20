import { Router } from "express";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";
import { TaxSlabController } from "./controller";

const router = Router();

router.get("/", isUser, requirePermission("taxSlabs", "read"), TaxSlabController.index);
router.post("/", isUser, requirePermission("taxSlabs", "create"), TaxSlabController.create);
router.post("/copy", isUser, requirePermission("taxSlabs", "create"), TaxSlabController.copy);
router.get("/:id", isUser, requirePermission("taxSlabs", "read"), TaxSlabController.retrieve);
router.patch("/:id", isUser, requirePermission("taxSlabs", "update"), TaxSlabController.update);
router.delete("/:id", isUser, requirePermission("taxSlabs", "delete"), TaxSlabController.delete);

export const taxSlabRouter = router;
