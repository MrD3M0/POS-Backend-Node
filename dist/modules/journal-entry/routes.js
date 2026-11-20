"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.journalEntryRouter = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const isUser_1 = require("@/middlewares/isUser");
const permission_1 = require("@/middlewares/permission");
const router = (0, express_1.Router)();
// Journal entries are append-only accounting records. Admin/principal view;
// only the accountant posts/reverses. No direct edit/delete.
router.get("/", isUser_1.isUser, (0, permission_1.requirePermission)("journal", "read"), controller_1.JournalEntryController.index);
router.post("/", isUser_1.isUser, (0, permission_1.requirePermission)("journal", "create"), controller_1.JournalEntryController.create);
router.get("/:id", isUser_1.isUser, (0, permission_1.requirePermission)("journal", "read"), controller_1.JournalEntryController.retrieve);
router.post("/:id/reverse", isUser_1.isUser, (0, permission_1.requirePermission)("journal", "post"), controller_1.JournalEntryController.reverse);
// Intentionally no DELETE/PATCH: corrections are reversal entries only.
router.use((_, res) => res.status(405).json({ success: false, message: "Journal entries cannot be edited or deleted; post a reversal entry" }));
exports.journalEntryRouter = router;
