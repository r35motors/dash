export const dynamic = "force-dynamic";

import { dealershipDb } from "@/lib/db";
import { SalesView, SaleRecord } from "@/components/sales/sales-view";
import { AvailableVehicleOption } from "@/components/sales/add-sale-dialog";

interface SalesPageProps {
  searchParams?: Promise<{ vehicleId?: string; search?: string; add?: string }>;
}

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const preselectedVehicleId = resolvedParams?.vehicleId;
  const initialSearch = resolvedParams?.search || "";
  const initialOpenAdd = resolvedParams?.add === "true";

  // Fetch sales (with joined vehicle details & calculated profit)
  const rawSales = await dealershipDb.sales.getAll();

  // Fetch only available vehicles for the "Record New Sale" dropdown
  const rawAvailable = await dealershipDb.vehicles.getAll({ status: "Available" });

  const serializedSales: SaleRecord[] = rawSales.map((s) => ({
    id: s.id,
    vehicle_id: s.vehicle_id,
    buyer_name: s.buyer_name,
    sale_date: String(s.sale_date || ""),
    selling_price: s.selling_price,
    created_at: String(s.created_at || ""),
    profit: (s as any).profit,
    vehicle: s.vehicle
      ? {
          id: s.vehicle.id,
          vehicle_name: s.vehicle.vehicle_name,
          registration_number: s.vehicle.registration_number,
          owner_name: s.vehicle.owner_name,
          purchase_price: s.vehicle.purchase_price,
          status: s.vehicle.status,
        }
      : null,
  }));

  const serializedAvailable: AvailableVehicleOption[] = rawAvailable.map((v) => ({
    id: v.id,
    vehicle_name: v.vehicle_name,
    registration_number: v.registration_number,
    owner_name: v.owner_name,
    purchase_price: v.purchase_price,
    status: v.status,
  }));

  return (
    <SalesView
      initialSales={serializedSales}
      initialAvailableVehicles={serializedAvailable}
      preselectedVehicleId={preselectedVehicleId}
      initialSearch={initialSearch}
      initialOpenAdd={initialOpenAdd}
    />
  );
}
