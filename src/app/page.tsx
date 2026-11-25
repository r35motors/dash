export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Car,
  BadgeDollarSign,
  FileText,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Tag,
  User,
  Hash,
} from "lucide-react";
import { dealershipDb } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const [vehicles, rawSales, settings] = await Promise.all([
    dealershipDb.vehicles.getAll(),
    dealershipDb.sales.getAll(),
    dealershipDb.settings.get(),
  ]);

  const availableVehicles = vehicles.filter((v) => v.status === "Available");
  const soldVehicles = vehicles.filter((v) => v.status === "Sold");

  // Total vehicle value = COMBINED purchase price of all vehicles in inventory, including sold vehicles
  const totalVehicleValue = vehicles.reduce(
    (sum, v) => sum + (parseFloat(String(v.purchase_price)) || 0),
    0
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome & Clean Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            <ShieldCheck className="w-4 h-4 text-slate-700" />
            <span>Dealership Operations Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0F172A]">
            {settings?.business_name || "R35 MOTORS"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time fleet overview, active stock, sales throughput, and quick workflows.
          </p>
        </div>

        {/* Top Action Bar with Tactile Shortcuts */}
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <Link href="/vehicles?add=true" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-xs cursor-pointer min-h-[44px] sm:min-h-0 sm:h-9.5 px-4 rounded-xl active:scale-[0.98] transition-all duration-150">
              <Plus className="w-4 h-4" />
              <span>Add Vehicle</span>
            </Button>
          </Link>
          <Link href="/sales?add=true" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto gap-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 cursor-pointer min-h-[44px] sm:min-h-0 sm:h-9.5 px-4 rounded-xl active:scale-[0.98] transition-all duration-150"
            >
              <BadgeDollarSign className="w-4 h-4 text-emerald-600" />
              <span>Record Sale</span>
            </Button>
          </Link>
          <Link href="/invoices?create=true" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto gap-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 cursor-pointer min-h-[44px] sm:min-h-0 sm:h-9.5 px-4 rounded-xl active:scale-[0.98] transition-all duration-150"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Create Invoice</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Tremor-Style KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {/* Card 1: Total Vehicles */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-premium transition hover:border-slate-300">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Vehicles
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] tabular-nums">
              {vehicles.length}
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
              <span className="truncate">Fleet in inventory</span>
              {/* Minimal SVG Sparkline */}
              <div className="h-5 w-14 hidden sm:block shrink-0">
                <svg className="h-full w-full overflow-visible" viewBox="0 0 100 30">
                  <polyline
                    fill="none"
                    stroke="#0F172A"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="0,22 25,18 50,15 75,10 100,5"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Available Vehicles */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-premium transition hover:border-slate-300">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Available Stock
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E3A8A]">
              {availableVehicles.length}
            </div>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                Ready to sell
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Sold Vehicles */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-premium transition hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Delivered
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-700">
              {soldVehicles.length}
            </div>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                Completed sales
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Fleet Value */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-premium transition hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Fleet Value
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[17px] sm:text-2xl md:text-3xl font-bold tracking-tight text-[#0F172A] leading-tight tabular-nums">
              {formatCurrency(totalVehicleValue)}
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500">
              <span>Acquisition cost</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Sections: Available Vehicles & Recently Sold Vehicles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Available Vehicles */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-premium flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-200/80 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Available Vehicles
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  {availableVehicles.length} In Stock
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vehicles ready for customer inspection and sale
              </p>
            </div>
            <Link
              href="/vehicles?status=Available"
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 whitespace-nowrap shrink-0 transition"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-0 flex-1 flex flex-col">
            {availableVehicles.length === 0 ? (
              <div className="p-10 text-center flex-1 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <Car className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">No vehicles currently available</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">Add vehicles to populate your active inventory.</p>
                <Link href="/vehicles?add=true">
                  <Button size="sm" className="bg-[#0F172A] text-xs rounded-xl px-3.5">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Vehicle
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto divide-y divide-slate-100">
                {availableVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="font-semibold text-sm text-[#0F172A] truncate">
                        {vehicle.vehicle_name}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1 font-mono px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] border border-slate-200/60">
                          <Hash className="w-3 h-3 text-slate-400" />
                          {vehicle.registration_number}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <User className="w-3 h-3 text-slate-400" />
                          Prev: {vehicle.owner_name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">
                          Purchase Price
                        </div>
                        <div className="font-bold text-sm text-[#0F172A]">
                          {formatCurrency(vehicle.purchase_price)}
                        </div>
                      </div>

                      {/* "Sell" quick button */}
                      <Link href={`/sales?vehicleId=${vehicle.id}`}>
                        <Button
                          size="sm"
                          className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs gap-1.5 h-8 px-3 rounded-xl active:scale-95"
                        >
                          <BadgeDollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Sell</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Recently Sold Vehicles */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-premium flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-200/80 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Recently Sold Vehicles
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  {rawSales.length} Completed
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Delivered vehicle sales, buyers, and profit realized
              </p>
            </div>
            <Link
              href="/sales"
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 whitespace-nowrap shrink-0 transition"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-0 flex-1 flex flex-col">
            {rawSales.length === 0 ? (
              <div className="p-10 text-center flex-1 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">No vehicle sales recorded yet</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">Record your first sale to track profit and invoices.</p>
                <Link href="/sales?add=true">
                  <Button size="sm" variant="outline" className="text-xs rounded-xl px-3.5">
                    <BadgeDollarSign className="w-3.5 h-3.5 mr-1" /> Record Sale
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto divide-y divide-slate-100">
                {rawSales.map((sale) => {
                  const purchasePriceNum = parseFloat(
                    String(sale.vehicle?.purchase_price || "0")
                  ) || 0;
                  const sellingPriceNum = parseFloat(String(sale.selling_price)) || 0;
                  const profitNum = (sale as any).profit !== undefined
                    ? (sale as any).profit
                    : sellingPriceNum - purchasePriceNum;

                  return (
                    <div
                      key={sale.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="font-semibold text-sm text-[#0F172A] truncate">
                          {sale.vehicle?.vehicle_name || "Dealership Vehicle"}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 font-mono px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] border border-slate-200/60">
                            <Hash className="w-3 h-3 text-slate-400" />
                            {sale.vehicle?.registration_number || "-"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-700 font-medium">
                            <User className="w-3 h-3 text-slate-400" />
                            Buyer: {sale.buyer_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5">
                          <span>Cost: {formatCurrency(purchasePriceNum)}</span>
                          <span>&rarr;</span>
                          <span className="font-semibold text-slate-800">
                            Sold: {formatCurrency(sellingPriceNum)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <div className="text-left sm:text-right">
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">
                            Profit
                          </div>
                          <div
                            className={`font-bold text-sm ${
                              profitNum >= 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {profitNum >= 0 ? `+${formatCurrency(profitNum)}` : formatCurrency(profitNum)}
                          </div>
                        </div>

                        {/* "Invoice" quick button */}
                        <Link href={`/invoices?saleId=${sale.id}&vehicleId=${sale.vehicle_id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-200 hover:bg-slate-50 text-slate-700 text-xs gap-1.5 h-8 px-3 rounded-xl active:scale-95"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>Invoice</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
