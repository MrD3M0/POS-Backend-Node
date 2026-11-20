"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.journalLineRouter = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const isUser_1 = require("@/middlewares/isUser");
const permission_1 = require("@/middlewares/permission");
const router = (0, express_1.Router)();
// Journal lines are part of append-only journal entries; no direct mutations.
router.get("/", isUser_1.isUser, (0, permission_1.requirePermission)("journal", "read"), controller_1.JournalLineController.index);
// Per-account debit/credit totals (one grouped query for the ledger list).
router.get("/totals", isUser_1.isUser, (0, permission_1.requirePermission)("journal", "read"), controller_1.JournalLineController.totals);
router.post("/", isUser_1.isUser, (0, permission_1.requirePermission)("journal", "create"), controller_1.JournalLineController.create);
router.get("/:id", isUser_1.isUser, (0, permission_1.requirePermission)("journal", "read"), controller_1.JournalLineController.retrieve);
router.use((_, res) => res.status(405).json({ success: false, message: "Journal lines cannot be edited or deleted" }));
exports.journalLineRouter = router;
