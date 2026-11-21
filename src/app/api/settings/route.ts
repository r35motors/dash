import { NextResponse } from "next/server";
import { dealershipDb } from "@/lib/db";

export async function GET() {
  try {
    const settings = await dealershipDb.settings.get();
    return NextResponse.json(settings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (!body.business_name || !body.business_name.trim()) {
      return NextResponse.json({ error: "Dealership name is required." }, { status: 400 });
    }
    if (!body.address || !body.address.trim()) {
      return NextResponse.json({ error: "Dealership address is required." }, { status: 400 });
    }
    if (!body.contact_number_1 || !body.contact_number_1.trim()) {
      return NextResponse.json({ error: "First contact number is required." }, { status: 400 });
    }
    if (!body.invoice_prefix || !body.invoice_prefix.trim()) {
      return NextResponse.json({ error: "Invoice prefix is required." }, { status: 400 });
    }

    const updated = await dealershipDb.settings.update({
      business_name: body.business_name.trim(),
      logo_path: body.logo_path !== undefined ? body.logo_path : null,
      address: body.address.trim(),
      contact_number_1: body.contact_number_1.trim(),
      contact_number_2: body.contact_number_2 ? body.contact_number_2.trim() : null,
      invoice_prefix: body.invoice_prefix.trim().toUpperCase(),
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
