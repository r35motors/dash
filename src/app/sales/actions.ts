"use server";

import { dealershipDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface CreateSaleInput {
  vehicle_id: string;
  buyer_name: string;
  selling_price: number | string;
  sale_date?: string;
}

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export async function createSaleAction(
  data: CreateSaleInput
): Promise<ActionResult> {
  try {
    const { vehicle_id, buyer_name, selling_price, sale_date } = data;

    if (!vehicle_id || typeof vehicle_id !== "string" || !vehicle_id.trim()) {
      return {
        success: false,
        error: "Vehicle is required.",
        statusCode: 400,
      };
    }

    if (!buyer_name || typeof buyer_name !== "string" || !buyer_name.trim()) {
      return {
        success: false,
        error: "Buyer name is required.",
        statusCode: 400,
      };
    }

    if (
      selling_price === undefined ||
      selling_price === null ||
      selling_price === ""
    ) {
      return {
        success: false,
        error: "Selling price is required.",
        statusCode: 400,
      };
    }

    const priceNum = Number(selling_price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return {
        success: false,
        error: "Selling price must be a positive number.",
        statusCode: 400,
      };
    }

    const created = await dealershipDb.sales.create({
      vehicle_id: vehicle_id.trim(),
      buyer_name: buyer_name.trim(),
      selling_price: priceNum,
      sale_date: sale_date ? String(sale_date).trim() : undefined,
    });

    try {
      revalidatePath("/sales");
      revalidatePath("/vehicles");
      revalidatePath("/");
      revalidatePath("/analytics");
      revalidatePath("/invoices");
    } catch {
      // Ignore when invoked outside Next.js request lifecycle
    }

    return {
      success: true,
      data: created,
      statusCode: 201,
    };
  } catch (err: any) {
    const errorMessage = err?.message || "Failed to record sale";
    const isSold =
      errorMessage.includes("already been sold") ||
      err?.code === "23505" ||
      err?.constraint?.includes("vehicle_id");
    const isNotFound = errorMessage === "Vehicle not found";

    let statusCode = 500;
    if (isSold) statusCode = 409;
    else if (isNotFound) statusCode = 404;
    else if (
      errorMessage.includes("required") ||
      errorMessage.includes("positive number")
    ) {
      statusCode = 400;
    }

    return {
      success: false,
      error: isSold ? "This vehicle has already been sold." : errorMessage,
      statusCode,
    };
  }
}
