"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Run: pnpm docs:generate
// It scans src/router.ts and adds all your /api/* routes to openapi.ts automatically
const fs_1 = __importDefault(require("fs"));
const routerFile = fs_1.default.readFileSync("src/router.ts", "utf-8");
const regex = /router\.use\("([^"]+)",\s*(\w+)\)/g;
const paths = {};
let match;
while ((match = regex.exec(routerFile)) !== null) {
    const basePath = match[1];
    paths[`/api${basePath}/`] = {
        get: {
            tags: [basePath.replace("/", "")],
            summary: `List ${basePath}`,
            security: [{ bearerAuth: [] }],
            responses: { "200": { description: "OK" } },
        },
        post: {
            tags: [basePath.replace("/", "")],
            summary: `Create ${basePath}`,
            security: [{ bearerAuth: [] }],
            responses: { "201": { description: "Created" } },
        },
    };
    paths[`/api${basePath}/{id}`] = {
        get: {
            tags: [basePath.replace("/", "")],
            summary: `Get ${basePath} by ID`,
            security: [{ bearerAuth: [] }],
            responses: { "200": { description: "OK" } },
        },
        delete: {
            tags: [basePath.replace("/", "")],
            summary: `Delete ${basePath}`,
            security: [{ bearerAuth: [] }],
            responses: { "200": { description: "Deleted" } },
        },
    };
}
console.log("Found routes:", Object.keys(paths).length);
console.log(JSON.stringify(paths, null, 2));
// You can copy this output into openapi.ts -> paths
