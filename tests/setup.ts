import "dotenv/config";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ||
  "postgresql://postgres:root@localhost:5432/CRUD_TEST_DB?schema=public";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key-for-collify";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
