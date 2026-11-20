"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scholarshipRouter = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const isUser_1 = require("@/middlewares/isUser");
const authorized_1 = require("@/middlewares/authorized");
const router = (0, express_1.Router)();
// Schemes
router.get("/", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL", "ACCOUNTANT"), controller_1.ScholarshipController.index);
router.post("/", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "ACCOUNTANT"), controller_1.ScholarshipController.create);
router.patch("/:id", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "ACCOUNTANT"), controller_1.ScholarshipController.update);
router.delete("/:id", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "ACCOUNTANT"), controller_1.ScholarshipController.delete);
// Grants (the money given to a student)
router.get("/grants", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "PRINCIPAL", "ACCOUNTANT"), controller_1.ScholarshipController.listGrants);
router.post("/grants", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "ACCOUNTANT"), controller_1.ScholarshipController.grant);
router.post("/grants/:id/revoke", isUser_1.isUser, (0, authorized_1.isAuthorizedTo)("ADMIN", "ACCOUNTANT"), controller_1.ScholarshipController.revoke);
exports.scholarshipRouter = router;
