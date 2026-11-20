"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("dotenv/config");
const app_js_1 = require("./app.js");
Object.defineProperty(exports, "app", { enumerable: true, get: function () { return app_js_1.app; } });
const prismaClient_js_1 = require("./lib/prismaClient.js");
const seedDefaultAdmin_js_1 = require("./dev/seedDefaultAdmin.js");
const PORT = Number(process.env.PORT) || 8000;
async function main() {
    try {
        await prismaClient_js_1.prismaMain.$connect();
        console.log("✓ DB connected");
        await (0, seedDefaultAdmin_js_1.seedDefaultAdmin)();
        app_js_1.app.listen(PORT, () => {
            console.log(`✓ Server: http://localhost:${PORT}`);
            console.log(`✓ Modern Docs (Scalar): http://localhost:${PORT}/api-docs`);
            console.log(`✓ Swagger UI: http://localhost:${PORT}/api-docs/swagger`);
            console.log(`✓ OpenAPI JSON: http://localhost:${PORT}/api-docs/json`);
        });
    }
    catch (e) {
        console.error("✗ Start failed:", e);
        process.exit(1);
    }
}
if (process.env.NODE_ENV !== "test") {
    main();
}
