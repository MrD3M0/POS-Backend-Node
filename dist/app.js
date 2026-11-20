"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const trimBody_js_1 = require("./middlewares/trimBody.js");
const router_js_1 = __importDefault(require("./router.js"));
const swagger_js_1 = __importDefault(require("./docs/swagger.js"));
function createApp() {
    const app = (0, express_1.default)();
    const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, cookie_parser_1.default)());
    if (process.env.NODE_ENV !== "test")
        app.use((0, morgan_1.default)("dev"));
    app.use((0, cors_1.default)({ origin: CORS_ORIGIN, credentials: true }));
    app.get("/", (req, res) => res.json({ message: "COLLIFY API running" }));
    app.use("/api-docs", swagger_js_1.default);
    app.use("/api", trimBody_js_1.trimBody, router_js_1.default);
    app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));
    return app;
}
exports.app = createApp();
