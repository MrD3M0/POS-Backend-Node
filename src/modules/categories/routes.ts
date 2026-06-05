import { Router } from "express";
import CategoryController from "./controller";

const categoryRouter: Router = Router();

categoryRouter.get("/", CategoryController.retrieve);
categoryRouter.post("/create", CategoryController.create);

export default categoryRouter;
