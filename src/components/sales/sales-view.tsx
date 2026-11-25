"use client";

import * as React from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  BadgeDollarSign,
  Search,
  X,
  User,
  Plus,
  Receipt,
  TrendingUp,
  FileText,
  Car,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";
import { AddSaleDialog, AvailableVehicleOption } from "./add-sale-dialog";

export interface SaleRecord {
  id: string;
  vehicle_id: string;
  buyer_name: string;
  sale_date: string;
  selling_price: string | number;
  created_at: string;
  profit?: number;
  vehicle?: {
    id: string;
    vehicle_name: string;
    registration_number: string;
    owner_name: string;
    purchase_price: string | number;
    status: string;
  } | null;
}

interface SalesViewProps {
  initialSales: SaleRecord[];
  initialAvailableVehicles: AvailableVehicleOption[];
  preselectedVehicleId?: string;
  initialSearch?: string;
  initialOpenAdd?: boolean;
}

export function SalesView({
  initialSales,
  initialAvailableVehicles,
  preselectedVehicleId,
  initialSearch = "",
  initialOpenAdd = false,
}: SalesViewProps) {
  const [sales, setSales] = React.useState<SaleRecord[]>(initialSales);
  const [availableVehicles, setAvailableVehicles] = React.useState<AvailableVehicleOption[]>(
    initialAvailableVehicles
  );
  const [searchQuery, setSearchQuery] = React.useState<string>(initialSearch);
  const [isAddOpen, setIsAddOpen] = React.useState(Boolean(preselectedVehicleId || initialOpenAdd));

  // Sync state if initial props change
  React.useEffect(() => {
    setSales(initialSales);
  }, [initialSales]);

  React.useEffect(() => {
    setAvailableVehicles(initialAvailableVehicles);
  }, [initialAvailableVehicles]);

  // If preselectedVehicleId or initialOpenAdd is passed, open the dialog
  React.useEffect(() => {
    if (preselectedVehicleId || initialOpenAdd) {
      setIsAddOpen(true);
    }
  }, [preselectedVehicleId, initialOpenAdd]);

  // Handle new sale recorded
  const handleSaleCompleted = (newSale: any) => {
    // Add sale to top of sales list
    setSales((prev) => [newSale, ...prev]);

    // Remove vehicle from available vehicles list
    setAvailableVehicles((prev) =>
      prev.filter((v) => v.id !== newSale.vehicle_id)
    );
  };

  // Real-time search filter matching vehicle name, registration number, or buyer name
  const filteredSales = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sales;

    return sales.filter((sale) => {
      const vehicleName = sale.vehicle?.vehicle_name?.toLowerCase() || "";
      const regNumber = sale.vehicle?.registration_number?.toLowerCase() || "";
      const buyerName = sale.buyer_name?.toLowerCase() || "";
      const ownerName = sale.vehicle?.owner_name?.toLowerCase() || "";

      return (
        vehicleName.includes(q) ||
        regNumber.includes(q) ||
        buyerName.includes(q) ||
        ownerName.includes(q)
      );
    });
  }, [sales, searchQuery]);

  // Summary Metrics
  const totalUnitsSold = sales.length;

  const totalSalesRevenue = React.useMemo(() => {
    return sales.reduce(
      (acc, s) => acc + (parseFloat(String(s.selling_price)) || 0),
      0
    );
  }, [sales]);

  const totalAcquisitionCost = React.useMemo(() => {
    return sales.reduce(
      (acc, s) => acc + (parseFloat(String(s.vehicle?.purchase_price || "0")) || 0),
      0
    );
  }, [sales]);

  const totalRealizedMargin = totalSalesRevenue - totalAcquisitionCost;
  const overallMarginPercentage =
    totalAcquisitionCost > 0
      ? ((totalRealizedMargin / totalAcquisitionCost) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Record New Sale Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-slate-50 flex items-center gap-2">
            <BadgeDollarSign className="w-6 h-6 text-slate-800 dark:text-slate-200" />
            Sales Ledger & Vehicle Deliveries
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track closed vehicle sales, client buyers, realized profit margins, and generate tax invoices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AddSaleDialog
            open={isAddOpen}
            onOpenChange={setIsAddOpen}
            availableVehicles={availableVehicles}
            preselectedVehicleId={preselectedVehicleId}
            onSaleCompleted={handleSaleCompleted}
          />
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Units Sold */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-premium hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="text-xs uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider flex items-center justify-between">
            <span>Units Delivered</span>
            <Car className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-slate-50 mt-2.5 tabular-nums">{totalUnitsSold}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Successfully sold &amp; delivered
          </p>
        </div>

        {/* Total Sales Volume */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-premium hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="text-xs uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider flex items-center justify-between">
            <span>Total Revenue</span>
            <BadgeDollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-slate-50 mt-2.5">
            {formatCurrency(totalSalesRevenue)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Gross transaction throughput
          </p>
        </div>

        {/* Realized Gross Margin / Profit */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-premium hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="text-xs uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider flex items-center justify-between">
            <span>Realized Margin</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-2.5">
            <span>+{formatCurrency(totalRealizedMargin)}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            +{overallMarginPercentage}% gross margin on inventory
          </p>
        </div>

        {/* Total Cost of Sold Fleet */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-premium hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="text-xs uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider flex items-center justify-between">
            <span>Acquisition Cost</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200 mt-2.5">
            {formatCurrency(totalAcquisitionCost)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Original purchase cost of delivered units
          </p>
        </div>
      </div>

      {/* Search Filter & Status Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Real-time Search Box */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 sm:top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            aria-label="Search vehicle, registration, or buyer"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vehicle, registration, or buyer..."
            className="w-full pl-9 pr-9 py-2.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-[#0F172A] dark:text-slate-50 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all placeholder:text-slate-400 min-h-[44px] sm:min-h-0"
          />
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

        {/* Count Indicator */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              {searchQuery
                ? `Showing ${filteredSales.length} of ${sales.length} delivered vehicles`
                : `Showing all ${sales.length} delivered vehicles`}
            </span>
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
      </div>

      {/* Empty State */}
      {filteredSales.length === 0 ? (
        <Card className="border border-dashed border-[#CBD5E1] bg-slate-50/50 dark:bg-slate-900/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <BadgeDollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#0F172A] dark:text-slate-50">
              {searchQuery
                ? `No sold vehicles matching "${searchQuery}"`
                : "No vehicle sales recorded yet"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
              {searchQuery
                ? "Try searching by a different vehicle model, buyer name, or registration number."
                : "When you sell an available vehicle, record it here to track realized profits and generate tax invoices."}
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
                <span>Record First Sale</span>
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
                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3 px-2 whitespace-nowrap">Vehicle</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3 px-2 whitespace-nowrap">Reg #</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3 px-2 whitespace-nowrap">Prev. Owner</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3 px-2 whitespace-nowrap">Buyer</TableHead>
                    <TableHead className="text-right font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3 px-2 whitespace-nowrap">Cost</TableHead>
                    <TableHead className="text-right font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3 px-2 whitespace-nowrap">Sold For</TableHead>
                    <TableHead className="text-right font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3 px-2 whitespace-nowrap">Profit</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3 px-2 whitespace-nowrap">Date</TableHead>
                    <TableHead className="text-right font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3 px-2 whitespace-nowrap">Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => {
                    const purchase =
                      parseFloat(String(sale.vehicle?.purchase_price || "0")) || 0;
                    const selling = parseFloat(String(sale.selling_price)) || 0;
                    const profit = sale.profit !== undefined ? sale.profit : selling - purchase;
                    const isProfitPositive = profit >= 0;

                    return (
                      <TableRow
                        key={sale.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        {/* 1. Vehicle Name */}
                        <TableCell className="font-semibold text-[#0F172A] dark:text-slate-50 py-3 px-2 max-w-[125px]">
                          <div className="truncate font-semibold text-xs" title={sale.vehicle?.vehicle_name || "Vehicle"}>
                            {sale.vehicle?.vehicle_name || "Vehicle"}
                          </div>
                        </TableCell>

                        {/* 2. Registration Number (monospace badge) */}
                        <TableCell className="py-3 px-2 whitespace-nowrap">
                          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold border border-slate-200/70 dark:border-slate-700/70 whitespace-nowrap inline-block">
                            {sale.vehicle?.registration_number || "-"}
                          </span>
                        </TableCell>

                        {/* 3. Previous Owner's Name */}
                        <TableCell className="text-slate-600 dark:text-slate-400 text-xs py-3 px-2">
                          <span className="truncate block max-w-[88px] font-medium text-slate-700 dark:text-slate-300" title={sale.vehicle?.owner_name || "-"}>
                            {sale.vehicle?.owner_name || "-"}
                          </span>
                        </TableCell>

                        {/* 4. Buyer Name */}
                        <TableCell className="text-slate-900 dark:text-slate-50 font-medium text-xs py-3 px-2">
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0"></span>
                            <span className="truncate max-w-[92px] font-semibold text-slate-900 dark:text-slate-50" title={sale.buyer_name}>
                              {sale.buyer_name}
                            </span>
                          </div>
                        </TableCell>

                        {/* 5. Purchase Price (₹ INR formatted) */}
                        <TableCell className="text-right text-slate-500 dark:text-slate-400 text-xs py-3 px-2 whitespace-nowrap tabular-nums">
                          {formatCurrency(purchase)}
                        </TableCell>

                        {/* 6. Selling Price (₹ INR formatted) */}
                        <TableCell className="text-right font-bold text-[#0F172A] dark:text-slate-50 text-xs py-3 px-2 whitespace-nowrap tabular-nums">
                          {formatCurrency(selling)}
                        </TableCell>

                        {/* 7. Profit (₹ INR formatted with green positive indicator) */}
                        <TableCell className="text-right py-3 px-2 whitespace-nowrap tabular-nums">
                          <span
                            className={`inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-full ${
                              isProfitPositive
                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
                                : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60"
                            }`}
                          >
                            {isProfitPositive ? "+" : ""}
                            {formatCurrency(profit)}
                          </span>
                        </TableCell>

                        {/* 8. Sale Date */}
                        <TableCell className="text-slate-500 dark:text-slate-400 text-xs py-3.5 whitespace-nowrap">
                          {formatDate(sale.sale_date)}
                        </TableCell>

                        {/* Quick Action: Create Invoice */}
                        <TableCell className="text-right py-3.5">
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs gap-1.5 active:scale-95"
                          >
                            <Link
                              href={`/invoices?saleId=${sale.id}&vehicleId=${sale.vehicle_id}`}
                            >
                              <Receipt className="w-3.5 h-3.5 text-blue-600" />
                              <span>Invoice</span>
                            </Link>
                          </Button>
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
            {filteredSales.map((sale) => {
              const purchase =
                parseFloat(String(sale.vehicle?.purchase_price || "0")) || 0;
              const selling = parseFloat(String(sale.selling_price)) || 0;
              const profit = sale.profit !== undefined ? sale.profit : selling - purchase;
              const isProfitPositive = profit >= 0;

              return (
                <div
                  key={sale.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-premium hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
                >
                  {/* Top Row: Vehicle Name & Monospace Registration */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-[#0F172A] dark:text-slate-50 leading-snug">
                        {sale.vehicle?.vehicle_name || "Vehicle"}
                      </h4>
                      <span className="inline-block mt-1.5 font-mono text-xs px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold border border-slate-200/70 dark:border-slate-700/70">
                        {sale.vehicle?.registration_number || "-"}
                      </span>
                    </div>
                    <Badge variant="sold" className="text-[10px]">
                      Delivered
                    </Badge>
                  </div>

                  {/* Parties: Buyer & Previous Owner */}
                  <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Buyer</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-50 truncate block mt-0.5">
                        {sale.buyer_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Previous Owner</span>
                      <span className="font-medium text-slate-600 dark:text-slate-400 truncate block mt-0.5">
                        {sale.vehicle?.owner_name || "-"}
                      </span>
                    </div>
                  </div>

                  {/* Financials: Purchase vs Selling Price & Profit */}
                  <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs items-center bg-slate-50/80 dark:bg-slate-800/70 -mx-4 px-4 py-2.5">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Cost</span>
                      <span className="font-medium text-slate-600 dark:text-slate-400 block mt-0.5">
                        {formatCurrency(purchase)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Sold For</span>
                      <span className="font-bold text-[#0F172A] dark:text-slate-50 block mt-0.5">
                        {formatCurrency(selling)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block font-medium">Profit</span>
                      <span
                        className={`font-bold text-xs inline-block mt-0.5 ${
                          isProfitPositive ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700"
                        }`}
                      >
                        {isProfitPositive ? "+" : ""}
                        {formatCurrency(profit)}
                      </span>
                    </div>
                  </div>

                  {/* Sale Date & Create Invoice Action */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(sale.sale_date)}</span>
                    </div>

                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs gap-1.5 active:scale-95"
                    >
                      <Link
                        href={`/invoices?saleId=${sale.id}&vehicleId=${sale.vehicle_id}`}
                      >
                        <Receipt className="w-3.5 h-3.5 text-blue-600" />
                        <span>Create Invoice</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
