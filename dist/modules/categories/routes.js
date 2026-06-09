"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_1 = __importDefault(require("./controller"));
const isUser_1 = require("@/middlewares/isUser");
const categoryRouter = (0, express_1.Router)();
categoryRouter.get("/", isUser_1.isUser, controller_1.default.index);
categoryRouter.post("/", isUser_1.isUser, controller_1.default.create);
categoryRouter.get("/:id", isUser_1.isUser, controller_1.default.retrieve);
// categoryRouter.patch("/:id", isUser, CategoryController)
exports.default = categoryRouter;
