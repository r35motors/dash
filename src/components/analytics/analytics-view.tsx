"use client";

import * as React from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Car,
  ShoppingBag,
  Calendar,
  ArrowUpRight,
  ChevronDown,
  Layers,
  FileText,
  BadgeDollarSign,
  Percent,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComparisonChart } from "./comparison-chart";
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Dealership Analytics & Intelligence
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Section 7 compliant financial metrics, lifetime performance, and monthly acquisition vs sales comparison.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/sales">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <BadgeDollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sales Ledger</span>
            </Button>
          </Link>
          <Link href="/invoices">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <span>Invoices</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Tabs: Lifetime Analytics & Monthly Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="bg-slate-100 p-1 border border-slate-200">
            <TabsTrigger
              value="lifetime"
              className="px-4 py-1.5 text-xs md:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0F172A] data-[state=active]:shadow-xs"
            >
              Lifetime Analytics
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="px-4 py-1.5 text-xs md:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0F172A] data-[state=active]:shadow-xs"
            >
              Monthly Analytics
            </TabsTrigger>
          </TabsList>

          {activeTab === "monthly" && (
            <div className="flex items-center gap-2">
              {isLoadingMonthly && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <RefreshCw className="w-3 h-3 animate-spin text-[#1E3A8A]" /> Updating...
                </span>
              )}
              {/* Month Selector */}
              <div className="w-36">
                <Select
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  className="h-8 text-xs font-medium"
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
                  className="h-8 text-xs font-medium"
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
            <Card className="border-[#E2E8F0] shadow-xs hover:border-slate-300 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Purchase Value
                  </CardTitle>
                  <div className="w-7 h-7 rounded-md bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                    <Car className="w-3.5 h-3.5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-[#0F172A] tracking-tight">
                  {formatCurrency(lifetime.totalPurchaseValue)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Sum of all acquired fleet purchase prices
                </p>
              </CardContent>
            </Card>

            {/* 2. Total Sales Value */}
            <Card className="border-[#E2E8F0] shadow-xs hover:border-slate-300 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Sales Value
                  </CardTitle>
                  <div className="w-7 h-7 rounded-md bg-slate-100 text-[#0F172A] flex items-center justify-center">
                    <BadgeDollarSign className="w-3.5 h-3.5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-[#0F172A] tracking-tight">
                  {formatCurrency(lifetime.totalSalesValue)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Sum of invoice totals (including items)
                </p>
              </CardContent>
            </Card>

            {/* 3. Total Profit */}
            <Card className="border-[#E2E8F0] shadow-xs hover:border-slate-300 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Gross Profit
                  </CardTitle>
                  <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-emerald-600 tracking-tight">
                  {formatCurrency(lifetime.totalProfit)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Sales value minus purchase cost of sold units
                </p>
              </CardContent>
            </Card>

            {/* 4. Vehicles Purchased */}
            <Card className="border-[#E2E8F0] shadow-xs hover:border-slate-300 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vehicles Purchased
                  </CardTitle>
                  <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-[#0F172A] tracking-tight">
                  {lifetime.vehiclesPurchased} Units
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Total lifetime acquired inventory
                </p>
              </CardContent>
            </Card>

            {/* 5. Vehicles Sold */}
            <Card className="border-[#E2E8F0] shadow-xs hover:border-slate-300 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vehicles Sold
                  </CardTitle>
                  <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-[#1E3A8A] tracking-tight">
                  {lifetime.vehiclesSold} Units
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Successfully delivered to customers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lifetime Secondary Metrics & Performance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-[#E2E8F0] shadow-xs bg-slate-50/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">
                    Lifetime Gross Margin
                  </div>
                  <div className="text-xl font-bold text-emerald-700 mt-0.5">
                    {lifetime.profitMarginPercent.toFixed(2)}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Gross profit as percentage of sales revenue
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Percent className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#E2E8F0] shadow-xs bg-slate-50/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">
                    Average Profit Per Unit
                  </div>
                  <div className="text-xl font-bold text-[#0F172A] mt-0.5">
                    {lifetime.vehiclesSold > 0
                      ? formatCurrency(lifetime.totalProfit / lifetime.vehiclesSold)
                      : "₹0"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Across {lifetime.vehiclesSold} sold vehicles
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1E3A8A] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#E2E8F0] shadow-xs bg-slate-50/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">
                    Active Stock In Hand
                  </div>
                  <div className="text-xl font-bold text-[#0F172A] mt-0.5">
                    {lifetime.availableVehicles} Units
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Available showroom fleet
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: MONTHLY ANALYTICS                                                  */}
        {/* ========================================================================= */}
        <TabsContent value="monthly" className="space-y-6 m-0">
          {/* Monthly Subheader */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1E3A8A]" />
              <span className="font-semibold text-slate-900">
                Reporting Period: {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </span>
            </div>
            <div className="text-slate-600">
              Showing acquisition costs and completed sales delivered in this specific calendar month.
            </div>
          </div>

          {/* 5 Primary Monthly Metric Cards (Section 7) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Monthly Purchase Value */}
            <Card className="border-[#E2E8F0] shadow-xs hover:border-slate-300 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Monthly Purchases
                  </CardTitle>
                  <div className="w-7 h-7 rounded-md bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                    <Car className="w-3.5 h-3.5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-[#0F172A] tracking-tight">
                  {formatCurrency(monthly.monthlyPurchaseValue)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Acquired in {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </p>
              </CardContent>
            </Card>

            {/* 2. Monthly Sales Value */}
            <Card className="border-[#E2E8F0] shadow-xs hover:border-slate-300 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Monthly Sales Value
                  </CardTitle>
                  <div className="w-7 h-7 rounded-md bg-slate-100 text-[#0F172A] flex items-center justify-center">
                    <BadgeDollarSign className="w-3.5 h-3.5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-[#0F172A] tracking-tight">
                  {formatCurrency(monthly.monthlySalesValue)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Invoiced totals sold this month
                </p>
              </CardContent>
            </Card>

            {/* 3. Monthly Profit */}
            <Card className="border-[#E2E8F0] shadow-xs hover:border-slate-300 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Monthly Gross Profit
                  </CardTitle>
                  <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-emerald-600 tracking-tight">
                  {formatCurrency(monthly.monthlyProfit)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Sales value minus purchase cost of units sold
                </p>
              </CardContent>
            </Card>

            {/* 4. Vehicles Purchased That Month */}
            <Card className="border-[#E2E8F0] shadow-xs hover:border-slate-300 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vehicles Purchased
                  </CardTitle>
                  <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-[#0F172A] tracking-tight">
                  {monthly.vehiclesPurchased} Units
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Acquisitions in this month
                </p>
              </CardContent>
            </Card>

            {/* 5. Vehicles Sold That Month */}
            <Card className="border-[#E2E8F0] shadow-xs hover:border-slate-300 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vehicles Sold
                  </CardTitle>
                  <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-[#1E3A8A] tracking-tight">
                  {monthly.vehiclesSold} Units
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Delivered in this month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Breakdown Table */}
          <Card className="border-[#E2E8F0] shadow-xs">
            <CardHeader className="pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-[#0F172A]">
                    Sales Ledger for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Breakdown of individual vehicle transactions and profit contributions
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {monthly.salesList.length} Transactions
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {monthly.salesList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No sales recorded in {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-[#E2E8F0] text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3">Vehicle Details</th>
                        <th className="p-3">Buyer</th>
                        <th className="p-3">Sale Date</th>
                        <th className="p-3 text-right">Purchase Price</th>
                        <th className="p-3 text-right">Sales Value</th>
                        <th className="p-3 text-right">Profit</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {monthly.salesList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-slate-900">
                              {item.vehicle_name}
                            </div>
                            <div className="font-mono text-slate-500 text-[10px]">
                              {item.registration_number}
                            </div>
                          </td>
                          <td className="p-3 text-slate-700 font-medium">{item.buyer_name}</td>
                          <td className="p-3 text-slate-500 whitespace-nowrap">
                            {formatDate(item.sale_date)}
                          </td>
                          <td className="p-3 text-right text-slate-600">
                            {formatCurrency(item.purchase_price)}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            {formatCurrency(item.sales_value)}
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-600">
                            +{formatCurrency(item.profit)}
                          </td>
                          <td className="p-3 text-center">
                            <Link href={`/invoices?saleId=${item.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-[11px] gap-1"
                              >
                                <FileText className="w-3 h-3 text-[#1E3A8A]" />
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* SECTION 7: COMPARISON CHART (Purchases vs. Sales vs. Gross Profit)         */}
      {/* ========================================================================= */}
      <Card className="border-[#E2E8F0] shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1E3A8A]" />
              <CardTitle className="text-base font-bold text-[#0F172A]">
                Annual Financial Comparison ({selectedYear})
              </CardTitle>
            </div>
            <CardDescription className="text-xs mt-0.5">
              Monthly acquisition cost vs. sales revenue vs. gross profit across all 12 calendar months
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500">Year:</span>
              <select
                value={selectedYear}
                onChange={handleYearChange}
                className="h-8 rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs font-semibold text-[#0F172A] shadow-xs"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Comparison Bar Chart */}
          <ComparisonChart data={yearlyComparison} />

          {/* Annual Summary Stats Banner */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span className="text-slate-500 font-medium">Year Total Purchases:</span>
              <span className="font-bold text-blue-700">{formatCurrency(yearTotalPurchases)}</span>
            </div>
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span className="text-slate-500 font-medium">Year Total Sales:</span>
              <span className="font-bold text-[#0F172A]">{formatCurrency(yearTotalSales)}</span>
            </div>
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span className="text-slate-500 font-medium">Year Total Gross Profit:</span>
              <span className="font-bold text-emerald-700">+{formatCurrency(yearTotalProfit)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
