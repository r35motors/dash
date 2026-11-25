import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { dealershipDb } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Vehicle ID is required" }, { status: 400 });
    }

    const deleted = await dealershipDb.vehicles.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 });
    }

    try {
      revalidatePath("/");
      revalidatePath("/vehicles");
      revalidatePath("/sales");
      revalidatePath("/invoices");
      revalidatePath("/analytics");
    } catch {
      // Ignore revalidatePath failures outside request context
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[API] Failed to delete vehicle:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete vehicle" },
      { status: 500 }
    );
  }
}
