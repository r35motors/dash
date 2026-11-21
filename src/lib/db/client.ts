import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let drizzleDb: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqlClient: ReturnType<typeof postgres> | null = null;

export function getDb() {
  if (drizzleDb) return drizzleDb;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.trim() === "") {
    throw new Error(
      "[Database Error] DATABASE_URL is not set. All data is stored in Supabase PostgreSQL. Please configure DATABASE_URL in your environment."
    );
  }

  try {
    sqlClient = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: connectionString.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
    });
    drizzleDb = drizzle(sqlClient, { schema });
    return drizzleDb;
  } catch (err: any) {
    console.error("[Database] Failed to connect to Supabase PostgreSQL:", err);
    throw new Error(`[Database Error] Could not connect to Supabase PostgreSQL: ${err?.message || err}`);
  }
}

// Initial eager attempt if DATABASE_URL is already in process.env
if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "") {
  try {
    getDb();
  } catch {
    // will throw on demand via getDb()
  }
}

export { drizzleDb, sqlClient, schema };
