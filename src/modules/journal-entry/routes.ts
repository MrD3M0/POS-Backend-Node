import { Router } from "express";
import { JournalEntryController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";

const router = Router();

// Journal entries are append-only accounting records. Admin/principal view;
// only the accountant posts/reverses. No direct edit/delete.
router.get("/", isUser, requirePermission("journal", "read"), JournalEntryController.index);
router.post("/", isUser, requirePermission("journal", "create"), JournalEntryController.create);
router.get("/:id", isUser, requirePermission("journal", "read"), JournalEntryController.retrieve);
router.post("/:id/reverse", isUser, requirePermission("journal", "post"), JournalEntryController.reverse);
// Intentionally no DELETE/PATCH: corrections are reversal entries only.
router.use((_, res) => res.status(405).json({ success: false, message: "Journal entries cannot be edited or deleted; post a reversal entry" }));

export const journalEntryRouter = router;
