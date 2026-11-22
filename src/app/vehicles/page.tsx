export const dynamic = "force-dynamic";

import { dealershipDb } from "@/lib/db";
import { Car } from "lucide-react";
import { VehiclesView } from "@/components/vehicles/vehicles-view";

interface VehiclesPageProps {
  searchParams?: Promise<{ status?: string; search?: string; add?: string }>;
}

export default async function VehiclesPage({ searchParams }: VehiclesPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const statusParam = resolvedParams?.status || "Available";
  const searchParam = resolvedParams?.search || "";
  const initialOpenAdd = resolvedParams?.add === "true";

  // Fetch all vehicles so client component can provide instant real-time filtering and tab transitions
  const rawVehicles = await dealershipDb.vehicles.getAll();

  const serializedVehicles = rawVehicles.map((v) => ({
    id: v.id,
    vehicle_name: v.vehicle_name,
    registration_number: v.registration_number,
    owner_name: v.owner_name,
    purchase_price: v.purchase_price,
    status: v.status,
    created_at:
      v.created_at instanceof Date
        ? v.created_at.toISOString()
        : String(v.created_at || ""),
    updated_at:
      v.updated_at instanceof Date
        ? v.updated_at.toISOString()
        : String(v.updated_at || ""),
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
              <Car className="w-4.5 h-4.5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Fleet Inventory & Available Vehicles
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Manage your dealership vehicle listings, register incoming cars, and review vehicles ready for sale.
          </p>
        </div>
      </div>

      <VehiclesView
        initialVehicles={serializedVehicles}
        initialStatus={statusParam}
        initialSearch={searchParam}
        initialOpenAdd={initialOpenAdd}
      />
    </div>
  );
}
