import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// Preserve database connection pool across serverless function re-evaluations and dev hot reloads
const globalForDb = globalThis as unknown as {
  __dealership_sql?: ReturnType<typeof postgres>;
  __dealership_db?: ReturnType<typeof drizzle<typeof schema>>;
};

export function getDb() {
  if (globalForDb.__dealership_db) return globalForDb.__dealership_db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.trim() === "") {
    throw new Error(
      "[Database Error] DATABASE_URL is not set. All data is stored in Supabase PostgreSQL. Please configure DATABASE_URL in your environment."
    );
  }

  try {
    // Ultra-optimized connection pooling for Supabase + Vercel Serverless:
    // - max: 10 allows concurrent parallel queries (Promise.all) without waiting
    // - idle_timeout: 30 preserves established SSL sockets between clicks for lightning-fast sub-20ms warm queries
    // - connect_timeout: 10 ensures reliable cross-region TLS handshake
    // - max_lifetime: 30 minutes
    // - prepare: false required for Supabase transaction poolers & PgBouncer
    const sqlClient =
      globalForDb.__dealership_sql ||
      postgres(connectionString, {
        max: 10,
        idle_timeout: 30,
        connect_timeout: 10,
        max_lifetime: 60 * 30,
        prepare: false,
        ssl: connectionString.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
      });

    globalForDb.__dealership_sql = sqlClient;
    globalForDb.__dealership_db = drizzle(sqlClient, { schema });

    return globalForDb.__dealership_db;
  } catch (err: any) {
    console.error("[Database] Failed to connect to Supabase PostgreSQL:", err);
    throw new Error(`[Database Error] Could not connect to Supabase PostgreSQL: ${err?.message || err}`);
  }
}

// Initial eager attempt if DATABASE_URL is available
if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "") {
  try {
    getDb();
  } catch {
    // will throw on demand via getDb()
  }
}

export const drizzleDb = globalForDb.__dealership_db;
export const sqlClient = globalForDb.__dealership_sql;
export { schema };
