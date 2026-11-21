import { NextResponse } from "next/server";
import { dealershipDb } from "@/lib/db";

export async function GET() {
  try {
    const sales = await dealershipDb.sales.getAll();
    return NextResponse.json(sales);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { vehicle_id, buyer_name, selling_price, sale_date } = body;

    // Validate vehicle_id
    if (!vehicle_id || typeof vehicle_id !== "string" || !vehicle_id.trim()) {
      return NextResponse.json(
        { error: "Vehicle is required." },
        { status: 400 }
      );
    }

    // Validate buyer_name
    if (!buyer_name || typeof buyer_name !== "string" || !buyer_name.trim()) {
      return NextResponse.json(
        { error: "Buyer name is required." },
        { status: 400 }
      );
    }

    // Validate selling_price
    if (selling_price === undefined || selling_price === null || selling_price === "") {
      return NextResponse.json(
        { error: "Selling price is required." },
        { status: 400 }
      );
    }

    const priceNum = Number(selling_price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json(
        { error: "Selling price must be a positive number." },
        { status: 400 }
      );
    }

    const created = await dealershipDb.sales.create({
      vehicle_id: vehicle_id.trim(),
      buyer_name: buyer_name.trim(),
      selling_price: priceNum,
      sale_date: sale_date ? String(sale_date).trim() : undefined,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    const errorMessage = err?.message || "Failed to record sale";

    if (errorMessage === "Vehicle not found") {
      return NextResponse.json({ error: errorMessage }, { status: 404 });
    }

    if (
      errorMessage.includes("already been sold") ||
      err?.code === "23505" ||
      err?.constraint?.includes("vehicle_id")
    ) {
      return NextResponse.json(
        { error: "This vehicle has already been sold." },
        { status: 409 }
      );
    }

    if (
      errorMessage.includes("required") ||
      errorMessage.includes("positive number")
    ) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
