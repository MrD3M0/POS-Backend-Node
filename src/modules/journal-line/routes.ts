import { Router } from "express";
import { JournalLineController } from "./controller";
import { isUser } from "@/middlewares/isUser";
import { requirePermission } from "@/middlewares/permission";

const router = Router();

// Journal lines are part of append-only journal entries; no direct mutations.
router.get("/", isUser, requirePermission("journal", "read"), JournalLineController.index);
// Per-account debit/credit totals (one grouped query for the ledger list).
router.get("/totals", isUser, requirePermission("journal", "read"), JournalLineController.totals);
router.post("/", isUser, requirePermission("journal", "create"), JournalLineController.create);
router.get("/:id", isUser, requirePermission("journal", "read"), JournalLineController.retrieve);
router.use((_, res) => res.status(405).json({ success: false, message: "Journal lines cannot be edited or deleted" }));

export const journalLineRouter = router;
