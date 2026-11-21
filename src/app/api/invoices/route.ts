import { NextResponse } from "next/server";
import { dealershipDb } from "@/lib/db";

export async function GET() {
  try {
    const invoices = await dealershipDb.invoices.getAll();
    return NextResponse.json(invoices);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vehicle_id, sale_id, invoice_number, invoice_total, invoice_snapshot, items } = body;

    if (!vehicle_id || invoice_total === undefined) {
      return NextResponse.json(
        { error: "Missing required invoice fields (vehicle_id, invoice_total)" },
        { status: 400 }
      );
    }

    const created = await dealershipDb.invoices.create({
      vehicle_id,
      sale_id,
      invoice_number,
      invoice_date: body.invoice_date,
      invoice_total,
      invoice_snapshot,
      items,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    const isClientError =
      err?.message?.includes("already exists") ||
      err?.message?.includes("required") ||
      err?.message?.includes("must be");
    return NextResponse.json(
      { error: err.message || "Failed to create invoice" },
      { status: isClientError ? 400 : 500 }
    );
  }
}
