"use server";

import { dealershipDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface CreateVehicleInput {
  vehicle_name: string;
  registration_number: string;
  owner_name: string;
  purchase_price: number | string;
}

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export async function createVehicleAction(
  data: CreateVehicleInput
): Promise<ActionResult> {
  try {
    const { vehicle_name, registration_number, owner_name, purchase_price } = data;

    if (!vehicle_name || typeof vehicle_name !== "string" || !vehicle_name.trim()) {
      return {
        success: false,
        error: "Vehicle name is required.",
        statusCode: 400,
      };
    }

    if (!registration_number || typeof registration_number !== "string" || !registration_number.trim()) {
      return {
        success: false,
        error: "Registration number is required.",
        statusCode: 400,
      };
    }

    if (!owner_name || typeof owner_name !== "string" || !owner_name.trim()) {
      return {
        success: false,
        error: "Previous owner's name is required.",
        statusCode: 400,
      };
    }

    if (purchase_price === undefined || purchase_price === null || purchase_price === "") {
      return {
        success: false,
        error: "Purchase price is required.",
        statusCode: 400,
      };
    }

    const priceNum = Number(purchase_price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return {
        success: false,
        error: "Purchase price must be a valid positive number.",
        statusCode: 400,
      };
    }

    const cleanReg = registration_number.trim().toUpperCase();

    // Check duplicate registration
    const existing = await dealershipDb.vehicles.getByRegistration(cleanReg);
    if (existing) {
      return {
        success: false,
        error: `A vehicle with registration number ${cleanReg} is already registered.`,
        statusCode: 409,
      };
    }

    const created = await dealershipDb.vehicles.create({
      vehicle_name: vehicle_name.trim(),
      registration_number: cleanReg,
      owner_name: owner_name.trim(),
      purchase_price: priceNum,
      status: "Available",
    });

    try {
      revalidatePath("/vehicles");
      revalidatePath("/");
      revalidatePath("/sales");
    } catch {
      // Ignore when invoked outside Next.js request lifecycle
    }

    return {
      success: true,
      data: created,
      statusCode: 201,
    };
  } catch (err: any) {
    const errorMessage = err?.message || "Failed to create vehicle";
    const isDuplicate =
      errorMessage.includes("is already registered") ||
      errorMessage.includes("duplicate") ||
      errorMessage.includes("unique");

    return {
      success: false,
      error: errorMessage,
      statusCode: isDuplicate ? 409 : 500,
    };
  }
}
