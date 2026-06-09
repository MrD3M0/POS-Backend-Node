// bill/routes.ts
import { Router } from "express";
import BillController from "./controller";
import { isUser } from "@/middlewares/isUser";

const billRouter: Router = Router();

// Basic CRUD routes
billRouter.get("/", isUser, BillController.index);
billRouter.post("/", isUser, BillController.create);
billRouter.get("/sales/total", isUser, BillController.getTotalSales);
billRouter.get("/date-range", isUser, BillController.getBillsByDateRange);
billRouter.get("/category/:categoryId", isUser, BillController.getBillsByCategory);
billRouter.get("/:id", isUser, BillController.getById);
billRouter.patch("/:id", isUser, BillController.update);
billRouter.delete("/:id", isUser, BillController.delete);

export default billRouter;