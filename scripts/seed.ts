import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { initialDealershipData } from "../src/lib/db/seed-data";
import { localStore } from "../src/lib/db/local-store";

async function runSeed() {
  console.log("🌱 Starting Dealership Database Seeding...");

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && databaseUrl.trim() !== "") {
    console.log("📡 Connecting to Supabase PostgreSQL at:", databaseUrl.replace(/:[^:@]*@/, ":***@"));
    try {
      // Dynamic import to avoid loading postgres if not configured
      const { drizzleDb, schema } = await import("../src/lib/db/client");
      if (!drizzleDb) {
        throw new Error("Drizzle client could not be initialized");
      }

      console.log("Clearing & upserting business settings...");
      await drizzleDb
        .insert(schema.businessSettings)
        .values({
          id: initialDealershipData.business_settings.id,
          business_name: initialDealershipData.business_settings.business_name,
          logo_path: initialDealershipData.business_settings.logo_path,
          address: initialDealershipData.business_settings.address,
          contact_number_1: initialDealershipData.business_settings.contact_number_1,
          contact_number_2: initialDealershipData.business_settings.contact_number_2,
          invoice_prefix: initialDealershipData.business_settings.invoice_prefix,
        })
        .onConflictDoNothing();

      console.log("Upserting vehicles...");
      for (const v of initialDealershipData.vehicles) {
        await drizzleDb
          .insert(schema.vehicles)
          .values({
            id: v.id,
            vehicle_name: v.vehicle_name,
            registration_number: v.registration_number,
            owner_name: v.owner_name,
            purchase_price: v.purchase_price,
            status: v.status,
            created_at: new Date(v.created_at),
            updated_at: new Date(v.updated_at),
          })
          .onConflictDoNothing();
      }

      console.log("Upserting sales...");
      for (const s of initialDealershipData.sales) {
        await drizzleDb
          .insert(schema.sales)
          .values({
            id: s.id,
            vehicle_id: s.vehicle_id,
            buyer_name: s.buyer_name,
            sale_date: new Date(s.sale_date),
            selling_price: s.selling_price,
            created_at: new Date(s.created_at),
          })
          .onConflictDoNothing();
      }

      console.log("Upserting invoices...");
      for (const inv of initialDealershipData.invoices) {
        await drizzleDb
          .insert(schema.invoices)
          .values({
            id: inv.id,
            invoice_number: inv.invoice_number,
            vehicle_id: inv.vehicle_id,
            sale_id: inv.sale_id,
            invoice_date: new Date(inv.invoice_date),
            invoice_total: inv.invoice_total,
            invoice_snapshot: inv.invoice_snapshot,
            created_at: new Date(inv.created_at),
          })
          .onConflictDoNothing();
      }

      console.log("Upserting invoice items...");
      for (const item of initialDealershipData.invoice_items) {
        await drizzleDb
          .insert(schema.invoiceItems)
          .values({
            id: item.id,
            invoice_id: item.invoice_id,
            description: item.description,
            amount: item.amount,
          })
          .onConflictDoNothing();
      }

      console.log("✅ Successfully seeded Supabase PostgreSQL!");
    } catch (err) {
      console.error("❌ Failed to seed PostgreSQL directly:", err);
      console.log("Falling back to initializing local store...");
      localStore.resetToDefault();
      console.log("✅ Local resilient store initialized with 5 vehicles, 2 sales, 2 invoices, and settings!");
    }
  } else {
    console.log("ℹ️ No DATABASE_URL provided. Initializing resilient local store...");
    localStore.resetToDefault();
    console.log("✅ Local resilient store initialized with 5 vehicles, 2 sales, 2 invoices, and Royal Motors settings!");
  }
}

runSeed()
  .then(() => {
    console.log("🎉 Seeding complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Fatal seed error:", err);
    process.exit(1);
  });
