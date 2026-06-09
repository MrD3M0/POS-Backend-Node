import { Router } from "express";
import ProductController from "./controller";
import { isAdmin, isUser } from "@/middlewares/isUser";

const productRouter: Router = Router();

productRouter.get("/", isUser, ProductController.index);
productRouter.post("/", isUser, ProductController.create);
productRouter.get("/:id", isUser, ProductController.getById);
productRouter.patch("/:id", isUser, ProductController.update);
productRouter.get(
  "/category/:categoryId",
  isUser,
  ProductController.getByCategoryId,
);
productRouter.delete("/:id", isAdmin, ProductController.delete);

export default productRouter;
