import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { apiReference } from "@scalar/express-api-reference";
import { openApiSpec } from "./openapi.js";

const docsRouter = Router();

// Raw JSON - for Postman / Bruno import
docsRouter.get("/json", (req, res) => {
  res.json(openApiSpec);
});

// Swagger UI - classic
docsRouter.use(
  "/swagger",
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    swaggerOptions: { persistAuthorization: true },
  }),
);

// Scalar UI - modern, recommended
docsRouter.use(
  "/",
  apiReference({
    spec: { content: openApiSpec },
    theme: "kepler",
  }),
);

export default docsRouter;
