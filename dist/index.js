"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const trimBody_1 = require("./middlewares/trimBody");
const router_1 = __importDefault(require("./router"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
// =================================================
// Middlewares
// =================================================
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(express_1.default.urlencoded({ extended: true }));
// Cookie-Parser for a Cookie-Parsing in an Object Order
app.use((0, cookie_parser_1.default)());
app.use("/api", [trimBody_1.trimBody], router_1.default);
app.listen(process.env.PORT || 8000, () => {
    console.log(`Server is running at PORT:${process.env.PORT || 8000}`);
});
