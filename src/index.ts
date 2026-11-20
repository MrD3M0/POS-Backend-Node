import "dotenv/config";
import { app } from "./app.js";
import { prismaMain } from "./lib/prismaClient.js";
import { seedDefaultAdmin } from "./dev/seedDefaultAdmin.js";

const PORT = Number(process.env.PORT) || 8000;

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

if (process.env.NODE_ENV !== "test") {
  main();
}

export { app };
