import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import fs from "fs";
import path from "path";
import postgres from "postgres";
import { initialDealershipData } from "../src/lib/db/seed-data";

const connectionString = process.env.DATABASE_URL;

async function main() {
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required.");
  }
  console.log("Connecting to Supabase PostgreSQL...");
  const sql = postgres(connectionString, { ssl: { rejectUnauthorized: false } });

  try {
    console.log("Reading schema SQL...");
    const schemaSql = fs.readFileSync(path.join(__dirname, "../supabase-schema.sql"), "utf-8");

    console.log("Applying schema to Supabase...");
    await sql.unsafe(schemaSql);
    console.log("Schema applied successfully!");

    console.log("Checking tables...");
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    console.log("Existing tables:", tables.map((t: any) => t.table_name));

    console.log("Seeding initial data if empty...");
    const existingVehicles = await sql`SELECT count(*) FROM vehicles`;
    if (parseInt(existingVehicles[0].count, 10) === 0) {
      console.log("Seeding initial business settings...");
      await sql`
        INSERT INTO business_settings (id, business_name, logo_path, address, contact_number_1, contact_number_2, invoice_prefix)
        VALUES (
          ${initialDealershipData.business_settings.id},
          ${initialDealershipData.business_settings.business_name},
          ${initialDealershipData.business_settings.logo_path},
          ${initialDealershipData.business_settings.address},
          ${initialDealershipData.business_settings.contact_number_1},
          ${initialDealershipData.business_settings.contact_number_2},
          ${initialDealershipData.business_settings.invoice_prefix}
        ) ON CONFLICT DO NOTHING;
      `;

      console.log("Seeding initial vehicles...");
      for (const v of initialDealershipData.vehicles) {
        await sql`
          INSERT INTO vehicles (id, vehicle_name, registration_number, owner_name, purchase_price, status, created_at, updated_at)
          VALUES (
            ${v.id},
            ${v.vehicle_name},
            ${v.registration_number},
            ${v.owner_name},
            ${v.purchase_price},
            ${v.status},
            ${v.created_at},
            ${v.updated_at}
          ) ON CONFLICT DO NOTHING;
        `;
      }

      console.log("Seeding initial sales...");
      for (const s of initialDealershipData.sales) {
        await sql`
          INSERT INTO sales (id, vehicle_id, buyer_name, sale_date, selling_price, created_at)
          VALUES (
            ${s.id},
            ${s.vehicle_id},
            ${s.buyer_name},
            ${s.sale_date},
            ${s.selling_price},
            ${s.created_at}
          ) ON CONFLICT DO NOTHING;
        `;
      }

      console.log("Seeding initial invoices...");
      for (const inv of initialDealershipData.invoices) {
        await sql`
          INSERT INTO invoices (id, invoice_number, vehicle_id, sale_id, invoice_date, invoice_total, invoice_snapshot, created_at)
          VALUES (
            ${inv.id},
            ${inv.invoice_number},
            ${inv.vehicle_id},
            ${inv.sale_id},
            ${inv.invoice_date},
            ${inv.invoice_total},
            ${JSON.stringify(inv.invoice_snapshot)},
            ${inv.created_at}
          ) ON CONFLICT DO NOTHING;
        `;
      }

      console.log("Seeding initial invoice items...");
      for (const item of initialDealershipData.invoice_items) {
        await sql`
          INSERT INTO invoice_items (id, invoice_id, description, amount)
          VALUES (
            ${item.id},
            ${item.invoice_id},
            ${item.description},
            ${item.amount}
          ) ON CONFLICT DO NOTHING;
        `;
      }
      console.log("Seeding complete!");
    } else {
      console.log(`Vehicles already present (${existingVehicles[0].count} records). Skipping seed.`);
    }

    console.log("Verifying data count...");
    const [vehiclesCount, salesCount, invoicesCount] = await Promise.all([
      sql`SELECT count(*) FROM vehicles`,
      sql`SELECT count(*) FROM sales`,
      sql`SELECT count(*) FROM invoices`,
    ]);
    console.log({
      vehicles: vehiclesCount[0].count,
      sales: salesCount[0].count,
      invoices: invoicesCount[0].count,
    });

  } catch (err: any) {
    console.error("Migration failed:", err);
  } finally {
    await sql.end();
  }
}

main();
