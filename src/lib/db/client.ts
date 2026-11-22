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
    // Optimized for Serverless environments (Vercel):
    // - max: 5 allows parallel queries in Promise.all without queueing
    // - idle_timeout: 4 quickly closes idle connections to prevent connection leaks
    // - connect_timeout: 10 allows reliable cross-region handshake
    // - prepare: false is required for Supabase transaction poolers & PgBouncer
    sqlClient = postgres(connectionString, {
      max: 5,
      idle_timeout: 4,
      connect_timeout: 10,
      max_lifetime: 60 * 15,
      prepare: false,
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
