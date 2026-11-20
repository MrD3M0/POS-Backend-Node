"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentFeeRouter = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const isUser_1 = require("@/middlewares/isUser");
const authorized_1 = require("@/middlewares/authorized");
const router = (0, express_1.Router)();
router.get("/", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL", "ACCOUNTANT", "STAFF"), controller_1.StudentFeeController.index);
router.post("/", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "ACCOUNTANT"), controller_1.StudentFeeController.create);
// Assign a structure to many students at once (a whole batch of new students).
router.post("/bulk", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "ACCOUNTANT"), controller_1.StudentFeeController.bulk);
router.get("/:id", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL", "ACCOUNTANT", "STAFF"), controller_1.StudentFeeController.retrieve);
router.delete("/:id", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "ACCOUNTANT"), controller_1.StudentFeeController.delete);
exports.studentFeeRouter = router;
