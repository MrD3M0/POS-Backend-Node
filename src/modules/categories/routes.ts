import { Router } from "express";
import CategoryController from "./controller";
import { isUser } from "@/middlewares/isUser";

const categoryRouter: Router = Router();

categoryRouter.get("/", isUser, CategoryController.index);
categoryRouter.post("/", isUser, CategoryController.create);
categoryRouter.get("/:id", isUser, CategoryController.retrieve);
categoryRouter.patch("/:id", isUser, CategoryController.update);

export default categoryRouter;
