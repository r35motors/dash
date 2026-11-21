import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

let drizzleDb: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqlClient: ReturnType<typeof postgres> | null = null;

if (connectionString && connectionString.trim() !== "") {
  try {
    sqlClient = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: connectionString.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
    });
    drizzleDb = drizzle(sqlClient, { schema });
  } catch (err) {
    console.warn("[Database] Could not initialize postgres client:", err);
    drizzleDb = null;
  }
}

export { drizzleDb, sqlClient, schema };
