import { prismaMain } from "../../src/lib/prismaClient";

export async function resetDb() {
  // RAW-SQL-EXCEPTION: TRUNCATE needs an identifier list, which PostgreSQL
  // cannot bind as parameters; the table list is resolved inside the database
  // (pg_tables) and never comes from user input.
  await prismaMain.$executeRawUnsafe(`
    DO $$
    DECLARE
      tables text;
    BEGIN
      SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
        INTO tables
        FROM pg_tables
       WHERE schemaname = 'public' AND tablename <> '_prisma_migrations';
      IF tables IS NOT NULL THEN
        EXECUTE 'TRUNCATE TABLE ' || tables || ' RESTART IDENTITY CASCADE';
      END IF;
    END $$;
  `);
}

export async function disconnectDb() {
  await prismaMain.$disconnect();
}
