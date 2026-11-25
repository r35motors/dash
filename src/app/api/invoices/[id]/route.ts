import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { dealershipDb } from "@/lib/db";
import React from "react";
import { pdf } from "@react-pdf/renderer";
import { InvoicePdfDocument } from "@/components/invoices/invoice-pdf-document";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    const invoice = await dealershipDb.invoices.getById(id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const format = url.searchParams.get("format");
    const acceptHeader = request.headers.get("accept") || "";

    // Return PDF stream/binary when requested
    if (format === "pdf" || acceptHeader.includes("application/pdf")) {
      const pdfData: any = {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        invoice_total: invoice.invoice_total,
        invoice_snapshot: invoice.invoice_snapshot,
        dealership: invoice.settings || undefined,
        vehicle: invoice.vehicle || undefined,
        items: invoice.items,
        buyer: (invoice as any).sale?.buyer_name
          ? { name: (invoice as any).sale.buyer_name }
          : undefined,
      };

      const docElement = React.createElement(InvoicePdfDocument, { data: pdfData });
      const pdfInstance = pdf(docElement as any);

      const blob = await pdfInstance.toBlob();
      const arrayBuffer = await blob.arrayBuffer();
      const filename = `${invoice.invoice_number || "invoice"}.pdf`;

      return new Response(arrayBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${filename}"`,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Default: return complete JSON with snapshot, vehicle, and items
    return NextResponse.json(invoice);
  } catch (err: any) {
    console.error("[API] Failed to get invoice:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    const deleted = await dealershipDb.invoices.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }

    try {
      revalidatePath("/");
      revalidatePath("/invoices");
      revalidatePath("/analytics");
    } catch {
      // Ignore revalidatePath failures outside request context
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[API] Failed to delete invoice:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
