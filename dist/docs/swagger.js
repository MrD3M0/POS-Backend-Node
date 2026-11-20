"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const express_api_reference_1 = require("@scalar/express-api-reference");
const openapi_js_1 = require("./openapi.js");
const docsRouter = (0, express_1.Router)();
// Raw JSON - for Postman / Bruno import
docsRouter.get("/json", (req, res) => {
    res.json(openapi_js_1.openApiSpec);
});
// Swagger UI - classic
docsRouter.use("/swagger", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openapi_js_1.openApiSpec, {
    swaggerOptions: { persistAuthorization: true },
}));
// Scalar UI - modern, recommended
docsRouter.use("/", (0, express_api_reference_1.apiReference)({
    spec: { content: openapi_js_1.openApiSpec },
    theme: "kepler",
}));
exports.default = docsRouter;
