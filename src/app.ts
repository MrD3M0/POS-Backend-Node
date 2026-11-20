import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import { trimBody } from "./middlewares/trimBody.js";
import appRoutes from "./router.js";
import docsRouter from "./docs/swagger.js";

export function createApp() {
  const app = express();
  const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));
  app.use(cors({ origin: CORS_ORIGIN, credentials: true }));

  app.get("/", (req, res) => res.json({ message: "COLLIFY API running" }));
  app.use("/api-docs", docsRouter);
  app.use("/api", trimBody, appRoutes);
  app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));

  return app;
}

export const app = createApp();
