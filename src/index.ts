import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import { trimBody } from "./middlewares/trimBody.js";
import appRoutes from "./router.js";
import { prismaMain } from "./lib/prismaClient.js";
import { seedDefaultAdmin } from "./dev/seedDefaultAdmin.js";
import docsRouter from "./docs/swagger.js";

const app = express();
const PORT = Number(process.env.PORT) || 8000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));

app.get("/", (req, res) => res.json({ message: "COLLIFY API running" }));
app.get("/health", (req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() }),
);

// Docs - always works, never crashes
app.use("/api-docs", docsRouter);

app.use("/api", trimBody, appRoutes);

app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found" }),
);

async function main() {
  try {
    await prismaMain.$connect();
    console.log("✓ DB connected");
    await seedDefaultAdmin();
    app.listen(PORT, () => {
      console.log(`✓ Server: http://localhost:${PORT}`);
      console.log(`✓ Modern Docs (Scalar): http://localhost:${PORT}/api-docs`);
      console.log(`✓ Swagger UI: http://localhost:${PORT}/api-docs/swagger`);
      console.log(`✓ OpenAPI JSON: http://localhost:${PORT}/api-docs/json`);
    });
  } catch (e) {
    console.error("✗ Start failed:", e);
    process.exit(1);
  }
}
main();
