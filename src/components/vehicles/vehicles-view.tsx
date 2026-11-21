"use client";

import * as React from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const [vehicles, setVehicles] = React.useState<VehicleRecord[]>(initialVehicles);
  const [statusTab, setStatusTab] = React.useState<string>(initialStatus);
  const [searchQuery, setSearchQuery] = React.useState<string>(initialSearch);
  const [isAddOpen, setIsAddOpen] = React.useState(Boolean(initialOpenAdd));

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
    <div className="space-y-6">
      {/* Top Controls: Filter Tabs, Real-Time Search, Add Vehicle Button */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Fleet Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setStatusTab("Available")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusTab.toLowerCase() === "available"
                ? "bg-[#0F172A] text-white border-[#0F172A] shadow-xs"
                : "bg-white text-slate-600 border-[#E2E8F0] hover:bg-slate-50"
            }`}
          >
            <span>Available</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                statusTab.toLowerCase() === "available"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {availableCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusTab("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusTab === "all"
                ? "bg-[#0F172A] text-white border-[#0F172A] shadow-xs"
                : "bg-white text-slate-600 border-[#E2E8F0] hover:bg-slate-50"
            }`}
          >
            <span>All Fleet</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                statusTab === "all"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusTab("Sold")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusTab.toLowerCase() === "sold"
                ? "bg-[#0F172A] text-white border-[#0F172A] shadow-xs"
                : "bg-white text-slate-600 border-[#E2E8F0] hover:bg-slate-50"
            }`}
          >
            <span>Sold</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                statusTab.toLowerCase() === "sold"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {soldCount}
            </span>
          </button>
        </div>

        {/* Real-time Search and Add Action */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Real-Time Search Box */}
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vehicle name or registration..."
              className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A] bg-white transition-all placeholder:text-slate-400"
            />
            {/* Clear Search Button */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
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

      {/* Count Indicator & Status Banner */}
      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-medium text-slate-600 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{getCountText()}</span>
        </div>

        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="h-6 text-xs text-slate-500 hover:text-slate-800 gap-1 px-2"
          >
            <X className="w-3 h-3" />
            <span>Clear search filter</span>
          </Button>
        )}
      </div>

      {/* Empty State */}
      {filteredVehicles.length === 0 ? (
        <Card className="border border-dashed border-[#CBD5E1] bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Car className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#0F172A]">
              {searchQuery
                ? `No vehicles found matching "${searchQuery}"`
                : statusTab.toLowerCase() === "available"
                ? "No available vehicles in stock"
                : "No vehicles in this fleet category"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
              {searchQuery
                ? "Try searching by a different vehicle model or registration number."
                : "Register a pre-owned vehicle to start managing pricing, inventory, and customer sales."}
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
                className="text-xs gap-1.5 bg-[#0F172A] hover:bg-[#1E293B]"
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
            <Card className="border border-[#E2E8F0] shadow-xs overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/75">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-700">Vehicle Name</TableHead>
                      <TableHead className="font-semibold text-slate-700">Registration</TableHead>
                      <TableHead className="font-semibold text-slate-700">Previous Owner</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">Purchase Price</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">Quick Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.map((vehicle) => {
                      const isAvailable = vehicle.status === "Available";
                      return (
                        <TableRow key={vehicle.id} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell className="font-semibold text-[#0F172A]">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{vehicle.vehicle_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                              {vehicle.registration_number}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-600 text-xs">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{vehicle.owner_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold text-[#0F172A] text-sm">
                            {formatCurrency(vehicle.purchase_price)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isAvailable ? "available" : "sold"}>
                              {vehicle.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {isAvailable ? (
                              <Button
                                asChild
                                size="sm"
                                className="h-8 text-xs font-semibold bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white shadow-xs gap-1.5"
                              >
                                <Link href={`/sales?vehicleId=${vehicle.id}`}>
                                  <BadgeDollarSign className="w-3.5 h-3.5" />
                                  <span>Sell this vehicle</span>
                                </Link>
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium px-2 py-1">
                                Already Sold
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Cards View (Visible on mobile, hidden on md+) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredVehicles.map((vehicle) => {
              const isAvailable = vehicle.status === "Available";
              return (
                <Card
                  key={vehicle.id}
                  className="border border-[#E2E8F0] shadow-xs hover:border-slate-300 transition-all overflow-hidden"
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Top Row: Vehicle Name & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-[#0F172A] leading-snug">
                          {vehicle.vehicle_name}
                        </h4>
                        <span className="inline-block mt-1 font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                          {vehicle.registration_number}
                        </span>
                      </div>
                      <Badge variant={isAvailable ? "available" : "sold"}>
                        {vehicle.status}
                      </Badge>
                    </div>

                    {/* Meta Info: Owner & Purchase Price */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2E8F0] text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Previous Owner</span>
                        <span className="font-medium text-slate-700 truncate block mt-0.5">
                          {vehicle.owner_name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[11px] block">Purchase Price</span>
                        <span className="font-bold text-[#0F172A] text-sm block mt-0.5">
                          {formatCurrency(vehicle.purchase_price)}
                        </span>
                      </div>
                    </div>

                    {/* Quick Action Button */}
                    <div className="pt-2">
                      {isAvailable ? (
                        <Button
                          asChild
                          className="w-full h-8 text-xs font-semibold bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white shadow-xs gap-1.5"
                        >
                          <Link href={`/sales?vehicleId=${vehicle.id}`}>
                            <BadgeDollarSign className="w-3.5 h-3.5" />
                            <span>Sell this vehicle</span>
                          </Link>
                        </Button>
                      ) : (
                        <div className="w-full text-center py-1 text-xs text-slate-400 font-medium">
                          Vehicle already sold
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
