"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.holidayRouter = void 0;
const express_1 = require("express");
const isUser_1 = require("@/middlewares/isUser");
const permission_1 = require("@/middlewares/permission");
const controller_1 = require("./controller");
const router = (0, express_1.Router)();
// Everyone signed in can read the calendar (holidays are used by attendance
// and shown to students/staff), writes are admin-only.
router.get("/", isUser_1.isUser, (0, permission_1.requirePermission)("calendar", "read"), controller_1.HolidayController.index);
router.post("/", isUser_1.isUser, (0, permission_1.requirePermission)("calendar", "create"), controller_1.HolidayController.create);
router.post("/bulk-import", isUser_1.isUser, (0, permission_1.requirePermission)("calendar", "create"), controller_1.HolidayController.bulkImport);
router.post("/bulk", isUser_1.isUser, (0, permission_1.requirePermission)("calendar", "create"), controller_1.HolidayController.bulkCreate);
router.post("/weekly-offs", isUser_1.isUser, (0, permission_1.requirePermission)("calendar", "create"), controller_1.HolidayController.weeklyOffs);
router.get("/:id", isUser_1.isUser, (0, permission_1.requirePermission)("calendar", "read"), controller_1.HolidayController.retrieve);
router.patch("/:id", isUser_1.isUser, (0, permission_1.requirePermission)("calendar", "update"), controller_1.HolidayController.update);
router.patch("/:id/restore", isUser_1.isUser, (0, permission_1.requirePermission)("calendar", "update"), controller_1.HolidayController.restore);
router.delete("/:id", isUser_1.isUser, (0, permission_1.requirePermission)("calendar", "delete"), controller_1.HolidayController.delete);
exports.holidayRouter = router;
