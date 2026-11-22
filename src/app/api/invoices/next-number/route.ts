import { NextResponse } from "next/server";
import { dealershipDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const nextNumber = await dealershipDb.invoices.getNextNumber();
    return NextResponse.json({ next_number: nextNumber });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
