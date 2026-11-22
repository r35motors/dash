import fs from "fs";
import postgres from "postgres";

async function main() {
  const buf = fs.readFileSync("public/dealership-logo.png");
  const cleanB64 = buf.toString("base64");
  const dataUrl = `data:image/png;base64,${cleanB64}`;

  console.log("Clean PNG data URL prepared:", dataUrl.substring(0, 50) + "...", "Length:", dataUrl.length);

  const connStr = "postgresql://postgres:SREEhari%40123@db.nljirzchsrjbpwgxjdji.supabase.co:5432/postgres";
  const sql = postgres(connStr, { ssl: { rejectUnauthorized: false }, prepare: false });

  try {
    // 1. Update business_settings
    const res1 = await sql`
      UPDATE business_settings 
      SET logo_path = ${dataUrl}, business_name = 'R35 MOTORS'
      WHERE id = 'a0000000-0000-0000-0000-000000000001'
      RETURNING id, business_name, LENGTH(logo_path) as logo_len, SUBSTRING(logo_path, 1, 35) as logo_prefix;
    `;
    console.log("Updated business_settings:", res1);

    // 2. Update existing invoices snapshot to also have this clean logo
    const res2 = await sql`
      UPDATE invoices
      SET invoice_snapshot = jsonb_set(
        COALESCE(invoice_snapshot, '{}'::jsonb),
        '{dealership,logo_path}',
        to_jsonb(${dataUrl}::text)
      )
      RETURNING id, invoice_number, LENGTH(invoice_snapshot->'dealership'->>'logo_path') as snap_logo_len;
    `;
    console.log("Updated invoices:", res2);

    // 3. Verify base64 alignment
    const check = await sql`
      SELECT id, business_name, LENGTH(logo_path) as len,
             LENGTH(REPLACE(logo_path, 'data:image/png;base64,', '')) % 4 as b64_mod4
      FROM business_settings;
    `;
    console.log("Verification check (b64_mod4 must be 0):", check);

  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
