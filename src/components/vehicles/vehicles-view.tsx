"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { CsvExportControl } from "@/components/ui/csv-export-control";
import { downloadCsv, isOnOrBeforeDate } from "@/lib/csv";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Car,
  Search,
  X,
  BadgeDollarSign,
  User,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
} from "lucide-react";
import { AddVehicleDialog } from "./add-vehicle-dialog";

export interface VehicleRecord {
  id: string;
  vehicle_name: string;
  registration_number: string;
  owner_name: string;
  purchase_price: string | number;
  status: "Available" | "Sold" | string;
  created_at: string;
  updated_at?: string;
}

interface VehiclesViewProps {
  initialVehicles: VehicleRecord[];
  initialStatus?: string;
  initialSearch?: string;
  initialOpenAdd?: boolean;
}

export function VehiclesView({
  initialVehicles,
  initialStatus = "Available",
  initialSearch = "",
  initialOpenAdd = false,
}: VehiclesViewProps) {
  const router = useRouter();
  const [vehicles, setVehicles] = React.useState<VehicleRecord[]>(initialVehicles);
  const [statusTab, setStatusTab] = React.useState<string>(initialStatus);
  const [searchQuery, setSearchQuery] = React.useState<string>(initialSearch);
  const [isAddOpen, setIsAddOpen] = React.useState(Boolean(initialOpenAdd));
  const [deleteTarget, setDeleteTarget] = React.useState<VehicleRecord | null>(null);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/vehicles/${deleteTarget.id}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Failed to delete vehicle.");
    }
    setVehicles((prev) => prev.filter((v) => v.id !== deleteTarget.id));
    router.refresh();
  };

  const handleExportCsv = (tillDate: string) => {
    const rows = filteredVehicles
      .filter((v) => isOnOrBeforeDate(v.created_at, tillDate))
      .map((v) => [
        v.vehicle_name,
        v.registration_number,
        v.owner_name,
        Number(v.purchase_price || 0),
        v.status,
        formatDate(v.created_at),
      ]);

    downloadCsv(
      `r35-vehicles-till-${tillDate}.csv`,
      ["Vehicle Name", "Registration Number", "Previous Owner", "Purchase Price (INR)", "Status", "Added Date"],
      rows
    );
  };

  React.useEffect(() => {
    if (initialOpenAdd) {
      setIsAddOpen(true);
    }
  }, [initialOpenAdd]);

  // Sync state if initialVehicles change
  React.useEffect(() => {
    setVehicles(initialVehicles);
  }, [initialVehicles]);

  const availableCount = vehicles.filter((v) => v.status === "Available").length;
  const soldCount = vehicles.filter((v) => v.status === "Sold").length;
  const totalCount = vehicles.length;

  // Real-time filtering matching vehicle name and registration number
  const filteredVehicles = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return vehicles.filter((v) => {
      // Status filter
      if (statusTab !== "all" && v.status.toLowerCase() !== statusTab.toLowerCase()) {
        return false;
      }
      // Search filter matching vehicle name and registration number
      if (!q) return true;
      const matchName = v.vehicle_name.toLowerCase().includes(q);
      const matchReg = v.registration_number.toLowerCase().includes(q);
      return matchName || matchReg;
    });
  }, [vehicles, statusTab, searchQuery]);

  const handleVehicleAdded = (newVehicle: VehicleRecord) => {
    setVehicles((prev) => [newVehicle, ...prev]);
    // Switch to Available view so the user immediately sees the newly registered vehicle
    setStatusTab("Available");
  };

  const getCountText = () => {
    const count = filteredVehicles.length;
    const isAvailableTab = statusTab.toLowerCase() === "available";

    if (searchQuery.trim()) {
      if (isAvailableTab) {
        return `Showing ${count} of ${availableCount} available vehicle${availableCount === 1 ? "" : "s"}`;
      }
      return `Showing ${count} vehicle${count === 1 ? "" : "s"} matching "${searchQuery}"`;
    }

    if (isAvailableTab) {
      return `Showing ${count} available vehicle${count === 1 ? "" : "s"}`;
    }
    if (statusTab.toLowerCase() === "sold") {
      return `Showing ${count} sold vehicle${count === 1 ? "" : "s"}`;
    }
    return `Showing ${count} fleet vehicle${count === 1 ? "" : "s"}`;
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Top Controls: Filter Tabs, Real-Time Search, Add Vehicle Button */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Apple HIG Segmented Control Filter Tabs */}
        <div className="inline-flex shrink-0 items-center gap-1 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 overflow-x-auto select-none">
          <button
            type="button"
            onClick={() => setStatusTab("Available")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 active:scale-95 ${
              statusTab.toLowerCase() === "available"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-xs border border-slate-200/60 dark:border-slate-700/60"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
            }`}
          >
            <span>Available</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                statusTab.toLowerCase() === "available"
                  ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              {availableCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 active:scale-95 ${
              statusTab === "all"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-xs border border-slate-200/60 dark:border-slate-700/60"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
            }`}
          >
            <span>All Fleet</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                statusTab === "all"
                  ? "bg-slate-900 dark:bg-slate-800 text-white border border-transparent dark:border-slate-700"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusTab("Sold")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 active:scale-95 ${
              statusTab.toLowerCase() === "sold"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-xs border border-slate-200/60 dark:border-slate-700/60"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
            }`}
          >
            <span>Sold</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                statusTab.toLowerCase() === "sold"
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              {soldCount}
            </span>
          </button>
        </div>

        {/* Real-time Search and Add Action */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Real-Time Search Box with Inset Lens */}
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 sm:top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              aria-label="Search fleet or registration"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fleet or registration..."
              className="w-full pl-9 pr-9 py-2.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-[#0F172A] dark:text-slate-50 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all placeholder:text-slate-400 min-h-[44px] sm:min-h-0"
            />
            {/* Clear Search Button */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-1.5 top-1.5 sm:top-1 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer rounded-lg"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <AddVehicleDialog
            open={isAddOpen}
            onOpenChange={setIsAddOpen}
            onVehicleAdded={handleVehicleAdded}
          />
        </div>
      </div>

      {/* Count Indicator & Export CSV Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{getCountText()}</span>
          </div>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="h-6 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 gap-1 px-2"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </Button>
          )}
        </div>

        <CsvExportControl onExport={handleExportCsv} />
      </div>

      {/* Empty State */}
      {filteredVehicles.length === 0 ? (
        <Card className="border border-dashed border-[#CBD5E1] bg-slate-50/50 dark:bg-slate-900/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <Car className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#0F172A] dark:text-slate-50">
              {searchQuery
                ? `No vehicles found matching "${searchQuery}"`
                : statusTab.toLowerCase() === "available"
                ? "No available vehicles in stock"
                : "No vehicles in this fleet category"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
              {searchQuery
                ? "Try searching by a different vehicle model or registration number."
                : "Register a vehicle to start managing pricing, inventory, and customer sales."}
            </p>
            {searchQuery ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="text-xs gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Search</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setIsAddOpen(true)}
                className="text-xs gap-1.5 bg-[#0F172A] dark:bg-blue-600 hover:bg-[#1E293B] dark:hover:bg-blue-500"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Vehicle</span>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-premium overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800">
                  <TableRow>
                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3.5 whitespace-nowrap">Vehicle Details</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3.5 whitespace-nowrap">Registration</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3.5 whitespace-nowrap">Previous Owner</TableHead>
                    <TableHead className="text-right font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3.5 whitespace-nowrap">Purchase Price</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3.5 whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-right font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3.5 whitespace-nowrap">Quick Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => {
                    const isAvailable = vehicle.status === "Available";
                    return (
                      <TableRow key={vehicle.id} className="hover:bg-slate-50/80 dark:bg-slate-800/70 dark:hover:bg-slate-800/60 transition-colors">
                        <TableCell className="font-semibold text-[#0F172A] dark:text-slate-50 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{vehicle.vehicle_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 whitespace-nowrap">
                          <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold border border-slate-200/70 dark:border-slate-700/70 whitespace-nowrap inline-block">
                            {vehicle.registration_number}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400 text-xs py-3.5">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">{vehicle.owner_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-[#0F172A] dark:text-slate-50 text-sm py-3.5">
                          {formatCurrency(vehicle.purchase_price)}
                        </TableCell>
                        <TableCell className="py-3.5">
                          <Badge variant={isAvailable ? "available" : "sold"}>
                            {vehicle.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right py-3.5 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {isAvailable ? (
                              <Button
                                asChild
                                size="sm"
                                className="h-8 rounded-xl px-3.5 text-xs font-semibold bg-[#0F172A] dark:bg-blue-600 hover:bg-[#1E293B] dark:hover:bg-blue-500 text-white shadow-xs gap-1.5 active:scale-95"
                              >
                                <Link href={`/sales?vehicleId=${vehicle.id}`} prefetch={false}>
                                  <BadgeDollarSign className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Sell vehicle</span>
                                </Link>
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium px-2 py-1">
                                Delivered
                              </span>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteTarget(vehicle)}
                              aria-label={`Delete ${vehicle.vehicle_name}`}
                              title="Delete vehicle"
                              className="h-8 w-8 p-0 rounded-xl border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:border-rose-200 dark:hover:border-rose-800/60 active:scale-95"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Cards View (Visible on mobile, hidden on md+) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredVehicles.map((vehicle) => {
              const isAvailable = vehicle.status === "Available";
              return (
                <div
                  key={vehicle.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-premium hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
                >
                  {/* Top Row: Vehicle Name & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-[#0F172A] dark:text-slate-50 leading-snug">
                        {vehicle.vehicle_name}
                      </h4>
                      <span className="inline-block mt-1.5 font-mono text-xs px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold border border-slate-200/70 dark:border-slate-700/70">
                        {vehicle.registration_number}
                      </span>
                    </div>
                    <Badge variant={isAvailable ? "available" : "sold"}>
                      {vehicle.status}
                    </Badge>
                  </div>

                  {/* Meta Info: Owner & Purchase Price */}
                  <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Previous Owner</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate block mt-0.5">
                        {vehicle.owner_name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[11px] block">Purchase Price</span>
                      <span className="font-bold text-[#0F172A] dark:text-slate-50 text-sm block mt-0.5">
                        {formatCurrency(vehicle.purchase_price)}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Buttons (Mobile-friendly 44px+ touch targets) */}
                  <div className="pt-2 grid grid-cols-2 gap-2">
                    {isAvailable ? (
                      <Button
                        asChild
                        className="min-h-[44px] rounded-xl text-xs font-semibold bg-[#0F172A] dark:bg-blue-600 hover:bg-[#1E293B] dark:hover:bg-blue-500 text-white shadow-xs gap-1.5 active:scale-95"
                      >
                        <Link href={`/sales?vehicleId=${vehicle.id}`} prefetch={false}>
                          <BadgeDollarSign className="w-4 h-4 text-emerald-400" />
                          <span>Sell Vehicle</span>
                        </Link>
                      </Button>
                    ) : (
                      <div className="min-h-[44px] flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Delivered
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDeleteTarget(vehicle)}
                      aria-label={`Delete ${vehicle.vehicle_name}`}
                      className="min-h-[44px] px-3 gap-1.5 rounded-xl border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Vehicle"
        description="This will permanently remove this vehicle from inventory along with any linked sale or invoice records."
        itemName={
          deleteTarget
            ? `${deleteTarget.vehicle_name} (${deleteTarget.registration_number})`
            : undefined
        }
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
