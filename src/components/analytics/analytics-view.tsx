"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Car,
  ShoppingBag,
  Calendar,
  Layers,
  FileText,
  BadgeDollarSign,
  Percent,
  RefreshCw,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ComparisonChart = dynamic(
  () => import("./comparison-chart").then((mod) => mod.ComparisonChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 w-full rounded-xl bg-slate-100/80 animate-pulse flex items-center justify-center text-xs text-slate-400">
        Loading financial comparison chart...
      </div>
    ),
  }
);
import {
  LifetimeAnalyticsResult,
  MonthlyAnalyticsResult,
  MonthlyChartPoint,
  MONTH_NAMES,
} from "@/lib/analytics";

interface AnalyticsViewProps {
  initialData: {
    lifetime: LifetimeAnalyticsResult;
    monthly: MonthlyAnalyticsResult;
    yearlyComparison: MonthlyChartPoint[];
    availableYears: number[];
    currentYear: number;
    currentMonth: number;
  };
}

export function AnalyticsView({ initialData }: AnalyticsViewProps) {
  const [activeTab, setActiveTab] = React.useState<string>("lifetime");
  const [selectedYear, setSelectedYear] = React.useState<number>(initialData.currentYear);
  const [selectedMonth, setSelectedMonth] = React.useState<number>(initialData.currentMonth);

  const [lifetime, setLifetime] = React.useState<LifetimeAnalyticsResult>(initialData.lifetime);
  const [monthly, setMonthly] = React.useState<MonthlyAnalyticsResult>(initialData.monthly);
  const [yearlyComparison, setYearlyComparison] = React.useState<MonthlyChartPoint[]>(
    initialData.yearlyComparison
  );
  const [availableYears, setAvailableYears] = React.useState<number[]>(initialData.availableYears);

  const [isLoadingMonthly, setIsLoadingMonthly] = React.useState<boolean>(false);

  // Fetch updated analytics when year or month changes
  const fetchMonthlyData = React.useCallback(async (year: number, month: number) => {
    setIsLoadingMonthly(true);
    try {
      const res = await fetch(`/api/analytics?year=${year}&month=${month}`);
      if (res.ok) {
        const json = await res.json();
        setMonthly(json.monthly);
        setYearlyComparison(json.yearlyComparison);
        if (json.lifetime) setLifetime(json.lifetime);
        if (json.availableYears) setAvailableYears(json.availableYears);
      }
    } catch (err) {
      console.error("Failed to load monthly analytics:", err);
    } finally {
      setIsLoadingMonthly(false);
    }
  }, []);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const yr = parseInt(e.target.value, 10);
    setSelectedYear(yr);
    fetchMonthlyData(yr, selectedMonth);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = parseInt(e.target.value, 10);
    setSelectedMonth(m);
    fetchMonthlyData(selectedYear, m);
  };

  // Calculate annual totals from comparison points
  const yearTotalPurchases = yearlyComparison.reduce((s, p) => s + p.purchases, 0);
  const yearTotalSales = yearlyComparison.reduce((s, p) => s + p.sales, 0);
  const yearTotalProfit = yearlyComparison.reduce((s, p) => s + p.profit, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] dark:text-slate-50">
              Dealership Analytics & Intelligence
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Section 7 compliant financial metrics, lifetime performance, and monthly acquisition vs sales comparison.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/sales">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#0F172A] dark:text-slate-50 shadow-xs">
              <BadgeDollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sales Ledger</span>
            </Button>
          </Link>
          <Link href="/invoices">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#0F172A] dark:text-slate-50 shadow-xs">
              <FileText className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>Invoices</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Tabs: Lifetime Analytics & Monthly Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="inline-flex p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 h-auto">
            <TabsTrigger
              value="lifetime"
              className="px-4 py-1.5 text-xs font-semibold rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#0F172A] dark:data-[state=active]:text-slate-50 data-[state=active]:shadow-xs transition-all"
            >
              Lifetime Analytics
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="px-4 py-1.5 text-xs font-semibold rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#0F172A] dark:data-[state=active]:text-slate-50 data-[state=active]:shadow-xs transition-all"
            >
              Monthly Analytics
            </TabsTrigger>
          </TabsList>

          {activeTab === "monthly" && (
            <div className="flex items-center gap-2">
              {isLoadingMonthly && (
                <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin text-slate-600 dark:text-slate-400" /> Updating...
                </span>
              )}
              {/* Month Selector */}
              <div className="w-36">
                <Select
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  className="h-8.5 text-xs font-medium"
                >
                  {MONTH_NAMES.map((name, index) => (
                    <option key={name} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Year Selector */}
              <div className="w-28">
                <Select
                  value={selectedYear}
                  onChange={handleYearChange}
                  className="h-8.5 text-xs font-medium"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: LIFETIME ANALYTICS                                                 */}
        {/* ========================================================================= */}
        <TabsContent value="lifetime" className="space-y-6 m-0">
          {/* 5 Primary Lifetime Metric Cards (Section 7) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Total Purchase Value */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 xl:p-5 shadow-premium hover:shadow-card-hover transition-all min-w-0">
              <div className="flex items-center justify-between gap-2 pb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Purchases
                </span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <Car className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg xl:text-xl font-bold text-[#0F172A] dark:text-slate-50 tracking-tight tabular-nums">
                {formatCurrency(lifetime.totalPurchaseValue)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Sum of acquired fleet purchase prices
              </p>
            </Card>

            {/* 2. Total Sales Value */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 xl:p-5 shadow-premium hover:shadow-card-hover transition-all min-w-0">
              <div className="flex items-center justify-between gap-2 pb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Sales Value
                </span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <BadgeDollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg xl:text-xl font-bold text-[#0F172A] dark:text-slate-50 tracking-tight tabular-nums">
                {formatCurrency(lifetime.totalSalesValue)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Sum of invoice totals (including items)
              </p>
            </Card>

            {/* 3. Total Profit */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 xl:p-5 shadow-premium hover:shadow-card-hover transition-all min-w-0">
              <div className="flex items-center justify-between gap-2 pb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Gross Profit
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg xl:text-xl font-bold text-emerald-600 tracking-tight tabular-nums">
                {formatCurrency(lifetime.totalProfit)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Sales value minus purchase cost of sold units
              </p>
            </Card>

            {/* 4. Vehicles Purchased */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-premium hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Fleet Purchased
                </span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#0F172A] dark:text-slate-50 tracking-tight">
                {lifetime.vehiclesPurchased} Units
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Total lifetime acquired inventory
              </p>
            </Card>

            {/* 5. Vehicles Sold */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-premium hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Vehicles Sold
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-700 tracking-tight">
                {lifetime.vehiclesSold} Units
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Successfully delivered to customers
              </p>
            </Card>
          </div>

          {/* Lifetime Secondary Metrics & Performance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    Lifetime Gross Margin
                  </div>
                  <div className="text-xl font-bold text-emerald-700 mt-1">
                    {lifetime.profitMarginPercent.toFixed(2)}%
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Gross profit as percentage of sales revenue
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    Average Profit Per Unit
                  </div>
                  <div className="text-xl font-bold text-[#0F172A] dark:text-slate-50 mt-1">
                    {lifetime.vehiclesSold > 0
                      ? formatCurrency(lifetime.totalProfit / lifetime.vehiclesSold)
                      : "₹0"}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Across {lifetime.vehiclesSold} sold vehicles
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-200/80 text-slate-800 dark:text-slate-200 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    Active Stock In Hand
                  </div>
                  <div className="text-xl font-bold text-[#0F172A] dark:text-slate-50 mt-1">
                    {lifetime.availableVehicles} Units
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Available showroom fleet
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-200/80 text-slate-800 dark:text-slate-200 flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: MONTHLY ANALYTICS                                                  */}
        {/* ========================================================================= */}
        <TabsContent value="monthly" className="space-y-6 m-0">
          {/* Monthly Subheader */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              <span className="font-semibold text-slate-900 dark:text-slate-50">
                Reporting Period: {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </span>
            </div>
            <div className="text-slate-500 dark:text-slate-400">
              Showing acquisition costs and completed sales delivered in this specific calendar month.
            </div>
          </div>

          {/* 5 Primary Monthly Metric Cards (Section 7) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Monthly Purchase Value */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 xl:p-5 shadow-premium hover:shadow-card-hover transition-all min-w-0">
              <div className="flex items-center justify-between gap-2 pb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Monthly Purchases
                </span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <Car className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg xl:text-xl font-bold text-[#0F172A] dark:text-slate-50 tracking-tight tabular-nums">
                {formatCurrency(monthly.monthlyPurchaseValue)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Acquired in {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </p>
            </Card>

            {/* 2. Monthly Sales Value */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 xl:p-5 shadow-premium hover:shadow-card-hover transition-all min-w-0">
              <div className="flex items-center justify-between gap-2 pb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Monthly Sales Value
                </span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <BadgeDollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg xl:text-xl font-bold text-[#0F172A] dark:text-slate-50 tracking-tight tabular-nums">
                {formatCurrency(monthly.monthlySalesValue)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Invoiced totals sold this month
              </p>
            </Card>

            {/* 3. Monthly Profit */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 xl:p-5 shadow-premium hover:shadow-card-hover transition-all min-w-0">
              <div className="flex items-center justify-between gap-2 pb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Monthly Gross Profit
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg xl:text-xl font-bold text-emerald-600 tracking-tight tabular-nums">
                {formatCurrency(monthly.monthlyProfit)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Sales value minus purchase cost of units sold
              </p>
            </Card>

            {/* 4. Vehicles Purchased That Month */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-premium hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Purchased
                </span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#0F172A] dark:text-slate-50 tracking-tight">
                {monthly.vehiclesPurchased} Units
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Acquisitions in this month
              </p>
            </Card>

            {/* 5. Vehicles Sold That Month */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-premium hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Vehicles Sold
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-700 tracking-tight">
                {monthly.vehiclesSold} Units
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Delivered in this month
              </p>
            </Card>
          </div>

          {/* Monthly Breakdown Table */}
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-premium overflow-hidden">
            <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] dark:text-slate-50">
                  Sales Ledger for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Breakdown of individual vehicle transactions and profit contributions
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                {monthly.salesList.length} Transactions
              </Badge>
            </div>
            <div>
              {monthly.salesList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No sales recorded in {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Vehicle Details</th>
                        <th className="py-3 px-4">Buyer</th>
                        <th className="py-3 px-4">Sale Date</th>
                        <th className="py-3 px-4 text-right">Purchase Price</th>
                        <th className="py-3 px-4 text-right">Sales Value</th>
                        <th className="py-3 px-4 text-right">Profit</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                      {monthly.salesList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 dark:text-slate-50">
                              {item.vehicle_name}
                            </div>
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                              {item.registration_number}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">{item.buyer_name}</td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {formatDate(item.sale_date)}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-400 font-medium">
                            {formatCurrency(item.purchase_price)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-50">
                            {formatCurrency(item.sales_value)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                            +{formatCurrency(item.profit)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Link href={`/invoices?saleId=${item.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-[11px] gap-1 rounded-xl border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98]"
                              >
                                <FileText className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                                <span>Invoice</span>
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* SECTION 7: COMPARISON CHART (Purchases vs. Sales vs. Gross Profit)         */}
      {/* ========================================================================= */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-premium overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              <h3 className="text-base font-bold text-[#0F172A] dark:text-slate-50">
                Annual Financial Comparison ({selectedYear})
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Monthly acquisition cost vs. sales revenue vs. gross profit across all 12 calendar months
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Year:</span>
            <Select
              aria-label="Select comparison year"
              value={selectedYear}
              onChange={handleYearChange}
              className="h-9 w-24 text-xs font-semibold"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Comparison Bar Chart */}
          <ComparisonChart data={yearlyComparison} />

          {/* Annual Summary Stats Banner */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Year Total Purchases:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(yearTotalPurchases)}</span>
            </div>
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Year Total Sales:</span>
              <span className="font-bold text-[#0F172A] dark:text-slate-50">{formatCurrency(yearTotalSales)}</span>
            </div>
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Year Total Gross Profit:</span>
              <span className="font-bold text-emerald-700">+{formatCurrency(yearTotalProfit)}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
