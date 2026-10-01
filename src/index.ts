import express, { Request, Response } from "express";
import dotenv from "dotenv/config";
import cookieParser from "cookie-parser";
import { trimBody } from "./middlewares/trimBody";
import appRoutes from "./router";
import cors from "cors";
import { prismaMain } from "./lib/prismaClient";

const app = express();
// =================================================
// Middlewares
// =================================================
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.urlencoded({ extended: true }));
// Cookie-Parser for a Cookie-Parsing in an Object Order
app.use(cookieParser());

app.use("/api", [trimBody], appRoutes);
async function main() {
  try {
    await prismaMain.$connect();
    console.log("Database connected");

    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at PORT:${process.env.PORT || 8000}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

main();
