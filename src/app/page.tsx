export const dynamic = "force-dynamic";

import { Suspense } from "react";
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
  Loader2,
} from "lucide-react";
import { dealershipDb } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            <ShieldCheck className="w-4 h-4 text-[#1E3A8A]" />
            <span>Dealership Operations Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0F172A]">
            {settings?.business_name || "R35 MOTORS"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time fleet overview, sales activity, and quick operational workflows.
          </p>
        </div>

        {/* Top Action Bar with Shortcuts */}
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto">
          <Link href="/vehicles?add=true" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-xs cursor-pointer h-9">
              <Plus className="w-4 h-4" />
              <span>Add Vehicle</span>
            </Button>
          </Link>
          <Link href="/sales?add=true" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto gap-2 border-slate-300 hover:bg-slate-100 text-[#0F172A] cursor-pointer h-9"
            >
              <BadgeDollarSign className="w-4 h-4 text-emerald-600" />
              <span>Record Sale</span>
            </Button>
          </Link>
          <Link href="/invoices?create=true" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto gap-2 border-slate-300 hover:bg-slate-100 text-[#0F172A] cursor-pointer h-9"
            >
              <FileText className="w-4 h-4 text-[#1E3A8A]" />
              <span>Create Invoice</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Primary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Card 1: Total Vehicles */}
        <Card className="hover:border-slate-300 transition-all shadow-xs border-[#E2E8F0]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Vehicles
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#0F172A] tracking-tight">
              {vehicles.length}
            </div>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
              <span>All registered fleet in inventory</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Available Vehicles */}
        <Card className="hover:border-slate-300 transition-all shadow-xs border-[#E2E8F0]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Available Vehicles
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1E3A8A] tracking-tight">
              {availableVehicles.length}
            </div>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Ready for test drive & customer sale</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Sold Vehicles */}
        <Card className="hover:border-slate-300 transition-all shadow-xs border-[#E2E8F0]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Sold Vehicles
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700 tracking-tight">
              {soldVehicles.length}
            </div>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Successfully delivered to buyers</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Total Vehicle Value (Combined purchase price of all vehicles in inventory including sold) */}
        <Card className="hover:border-slate-300 transition-all shadow-xs border-[#E2E8F0]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Vehicle Value
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight truncate">
              {formatCurrency(totalVehicleValue)}
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Combined acquisition value (including sold)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Sections: Available Vehicles & Recently Sold Vehicles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Available Vehicles */}
        <Card className="border-[#E2E8F0] shadow-xs flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-[#0F172A]">
                  Available Vehicles
                </CardTitle>
                <Badge variant="available" className="text-[11px] px-2 py-0.5">
                  {availableVehicles.length} In Stock
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Vehicles ready for customer inspection and sale
              </CardDescription>
            </div>
            <Link
              href="/vehicles?status=Available"
              className="text-xs font-semibold text-[#1E3A8A] hover:underline flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>

          <CardContent className="p-0 flex-1 flex flex-col">
            {availableVehicles.length === 0 ? (
              <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
                <Car className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-700">No vehicles currently available</p>
                <p className="text-xs text-slate-500 mt-0.5 mb-3">Add vehicles to populate your inventory.</p>
                <Link href="/vehicles?add=true">
                  <Button size="sm" className="bg-[#0F172A] text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Vehicle
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto divide-y divide-[#E2E8F0]">
                {availableVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="font-semibold text-sm text-[#0F172A] truncate">
                        {vehicle.vehicle_name}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1 font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
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
                          className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs gap-1.5 h-8 px-3"
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
          </CardContent>
        </Card>

        {/* Section 2: Recently Sold Vehicles */}
        <Card className="border-[#E2E8F0] shadow-xs flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-[#0F172A]">
                  Recently Sold Vehicles
                </CardTitle>
                <Badge variant="sold" className="text-[11px] px-2 py-0.5">
                  {rawSales.length} Completed
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Delivered vehicle sales, buyers, and profit realized
              </CardDescription>
            </div>
            <Link
              href="/sales"
              className="text-xs font-semibold text-[#1E3A8A] hover:underline flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>

          <CardContent className="p-0 flex-1 flex flex-col">
            {rawSales.length === 0 ? (
              <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-700">No vehicle sales recorded yet</p>
                <p className="text-xs text-slate-500 mt-0.5 mb-3">Record your first sale to track profit and invoices.</p>
                <Link href="/sales?add=true">
                  <Button size="sm" variant="outline" className="text-xs">
                    <BadgeDollarSign className="w-3.5 h-3.5 mr-1" /> Record Sale
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto divide-y divide-[#E2E8F0]">
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
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="font-semibold text-sm text-[#0F172A] truncate">
                          {sale.vehicle?.vehicle_name || "Dealership Vehicle"}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
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
                            className="border-slate-300 hover:bg-slate-100 text-slate-700 text-xs gap-1.5 h-8 px-3"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#1E3A8A]" />
                            <span>Invoice</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
