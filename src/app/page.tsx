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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            <ShieldCheck className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span>Dealership Operations Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-slate-50">
            {settings?.business_name || "R35 MOTORS"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time fleet overview, active stock, sales throughput, and quick workflows.
          </p>
        </div>

        {/* Top Action Bar with Tactile Shortcuts */}
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <Button asChild className="w-full sm:w-auto gap-2 bg-[#0F172A] dark:bg-blue-600 hover:bg-[#1E293B] dark:hover:bg-blue-500 text-white shadow-xs cursor-pointer min-h-[44px] sm:min-h-0 sm:h-9.5 px-4 rounded-xl active:scale-[0.98] transition-all duration-150">
            <Link href="/vehicles?add=true" prefetch={false}>
              <Plus className="w-4 h-4" />
              <span>Add Vehicle</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer min-h-[44px] sm:min-h-0 sm:h-9.5 px-4 rounded-xl active:scale-[0.98] transition-all duration-150"
          >
            <Link href="/sales?add=true" prefetch={false}>
              <BadgeDollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Record Sale</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer min-h-[44px] sm:min-h-0 sm:h-9.5 px-4 rounded-xl active:scale-[0.98] transition-all duration-150"
          >
            <Link href="/invoices?create=true" prefetch={false}>
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Create Invoice</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 4 Tremor-Style KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {/* Card 1: Total Vehicles */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-premium transition hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Vehicles
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-slate-50 tabular-nums">
              {vehicles.length}
            </div>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                Fleet in inventory
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Available Vehicles */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-premium transition hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Available Stock
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E3A8A] dark:text-blue-400">
              {availableVehicles.length}
            </div>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                Ready to sell
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Sold Vehicles */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-premium transition hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Delivered
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
              {soldVehicles.length}
            </div>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60/60 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                Completed sales
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Fleet Value */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-premium transition hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Fleet Value
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[17px] sm:text-2xl md:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-slate-50 leading-tight tabular-nums">
              {formatCurrency(totalVehicleValue)}
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              <span>Acquisition cost</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Sections: Available Vehicles & Recently Sold Vehicles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Available Vehicles */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-premium flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-slate-50">
                  Available Vehicles
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60/60 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  {availableVehicles.length} In Stock
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Vehicles ready for customer inspection and sale
              </p>
            </div>
            <Link
              href="/vehicles?status=Available"
              className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-900 flex items-center gap-1 whitespace-nowrap shrink-0 transition"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-0 flex-1 flex flex-col">
            {availableVehicles.length === 0 ? (
              <div className="p-10 text-center flex-1 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                  <Car className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No vehicles currently available</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">Add vehicles to populate your active inventory.</p>
                <Link href="/vehicles?add=true">
                  <Button size="sm" className="bg-[#0F172A] text-xs rounded-xl px-3.5">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Vehicle
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto divide-y divide-slate-100 dark:divide-slate-800">
                {availableVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:bg-slate-800/70 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="font-semibold text-sm text-[#0F172A] dark:text-slate-50 truncate">
                        {vehicle.vehicle_name}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1 font-mono px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] border border-slate-200/60 dark:border-slate-700/60 whitespace-nowrap">
                          <Hash className="w-3 h-3 text-slate-400" />
                          {vehicle.registration_number}
                        </span>
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
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
                        <div className="font-bold text-sm text-[#0F172A] dark:text-slate-50">
                          {formatCurrency(vehicle.purchase_price)}
                        </div>
                      </div>

                      {/* "Sell" quick button */}
                      <Button
                        asChild
                        size="sm"
                        className="bg-[#0F172A] dark:bg-blue-600 hover:bg-[#1E293B] dark:hover:bg-blue-500 text-white text-xs gap-1.5 h-8 px-3 rounded-xl active:scale-95"
                      >
                        <Link href={`/sales?vehicleId=${vehicle.id}`} prefetch={false}>
                          <BadgeDollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Sell</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Recently Sold Vehicles */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-premium flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-slate-50">
                  Recently Sold Vehicles
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  {rawSales.length} Completed
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Delivered vehicle sales, buyers, and profit realized
              </p>
            </div>
            <Link
              href="/sales"
              className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-900 flex items-center gap-1 whitespace-nowrap shrink-0 transition"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-0 flex-1 flex flex-col">
            {rawSales.length === 0 ? (
              <div className="p-10 text-center flex-1 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No vehicle sales recorded yet</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">Record your first sale to track profit and invoices.</p>
                <Link href="/sales?add=true">
                  <Button size="sm" variant="outline" className="text-xs rounded-xl px-3.5">
                    <BadgeDollarSign className="w-3.5 h-3.5 mr-1" /> Record Sale
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto divide-y divide-slate-100 dark:divide-slate-800">
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
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:bg-slate-800/70 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="font-semibold text-sm text-[#0F172A] dark:text-slate-50 truncate">
                          {sale.vehicle?.vehicle_name || "Dealership Vehicle"}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1 font-mono px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] border border-slate-200/60 dark:border-slate-700/60 whitespace-nowrap">
                            <Hash className="w-3 h-3 text-slate-400" />
                            {sale.vehicle?.registration_number || "-"}
                          </span>
                          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                            <User className="w-3 h-3 text-slate-400" />
                            Buyer: {sale.buyer_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                          <span>Cost: {formatCurrency(purchasePriceNum)}</span>
                          <span>&rarr;</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
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
                              profitNum >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"
                            }`}
                          >
                            {profitNum >= 0 ? `+${formatCurrency(profitNum)}` : formatCurrency(profitNum)}
                          </div>
                        </div>

                        {/* "Invoice" quick button */}
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs gap-1.5 h-8 px-3 rounded-xl active:scale-95"
                        >
                          <Link href={`/invoices?saleId=${sale.id}&vehicleId=${sale.vehicle_id}`} prefetch={false}>
                            <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Invoice</span>
                          </Link>
                        </Button>
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
