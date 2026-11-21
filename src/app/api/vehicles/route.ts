import { NextResponse } from "next/server";
import { dealershipDb } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const vehicles = await dealershipDb.vehicles.getAll({ status, search });
    return NextResponse.json(vehicles);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vehicle_name, registration_number, owner_name, purchase_price, status } = body;

    // Validate required fields
    if (!vehicle_name || typeof vehicle_name !== "string" || !vehicle_name.trim()) {
      return NextResponse.json(
        { error: "Vehicle name is required." },
        { status: 400 }
      );
    }

    if (!registration_number || typeof registration_number !== "string" || !registration_number.trim()) {
      return NextResponse.json(
        { error: "Registration number is required." },
        { status: 400 }
      );
    }

    if (!owner_name || typeof owner_name !== "string" || !owner_name.trim()) {
      return NextResponse.json(
        { error: "Previous owner's name is required." },
        { status: 400 }
      );
    }

    if (purchase_price === undefined || purchase_price === null || purchase_price === "") {
      return NextResponse.json(
        { error: "Purchase price is required." },
        { status: 400 }
      );
    }

    const priceNum = Number(purchase_price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json(
        { error: "Purchase price must be a valid positive number." },
        { status: 400 }
      );
    }

    const cleanReg = registration_number.trim().toUpperCase();

    // Check duplicate registration proactively before create
    const existing = await dealershipDb.vehicles.getByRegistration(cleanReg);
    if (existing) {
      return NextResponse.json(
        { error: `A vehicle with registration number ${cleanReg} is already registered.` },
        { status: 409 }
      );
    }

    const created = await dealershipDb.vehicles.create({
      vehicle_name: vehicle_name.trim(),
      registration_number: cleanReg,
      owner_name: owner_name.trim(),
      purchase_price: priceNum,
      status: (status as "Available" | "Sold") || "Available",
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    const errorMessage = err?.message || "Failed to add vehicle";
    if (
      errorMessage.includes("is already registered") ||
      errorMessage.includes("duplicate") ||
      errorMessage.includes("unique")
    ) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
