"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { MonthlyChartPoint } from "@/lib/analytics";
import { useTheme } from "@/components/theme-provider";

interface ComparisonChartProps {
  data: MonthlyChartPoint[];
}

export function ComparisonChart({ data }: ComparisonChartProps) {
  const { theme } = useTheme();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-80 flex items-center justify-center text-slate-400 text-sm">
        Loading comparison chart...
      </div>
    );
  }

  // Format axis in Lakhs or Crores for clean readability
  const formatYAxis = (val: number) => {
    if (Math.abs(val) >= 10000000) {
      return `₹${(val / 10000000).toFixed(1)}Cr`;
    }
    if (Math.abs(val) >= 100000) {
      return `₹${(val / 100000).toFixed(0)}L`;
    }
    return `₹${val}`;
  };

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="min-w-[540px] sm:min-w-full h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 12, right: 16, left: 10, bottom: 6 }}
            barGap={4}
          >
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200/70 dark:text-slate-800" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#94A3B8"
            fontSize={12}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            tickFormatter={formatYAxis}
            width={65}
          />
          <Tooltip
            formatter={(value: any, name: any) => {
              const labelMap: Record<string, string> = {
                purchases: "Acquisitions (Purchases)",
                sales: "Sales Value (Revenue)",
                profit: "Gross Profit",
              };
              return [formatCurrency(Number(value) || 0), labelMap[name] || name];
            }}
            labelFormatter={(label) => `Month: ${label}`}
            contentStyle={{
              backgroundColor: "#0F172A",
              color: "#FFFFFF",
              borderRadius: "8px",
              border: "1px solid #1E293B",
              fontSize: "12px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            formatter={(val) => {
              const labelMap: Record<string, string> = {
                purchases: "Purchases (Fleet Acquisition)",
                sales: "Sales Value (Completed Invoices)",
                profit: "Gross Profit",
              };
              return (
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 mr-4">
                  {labelMap[val] || val}
                </span>
              );
            }}
          />
          {/* 3 Metric Bars: Purchases, Sales, Gross Profit */}
          <Bar
            dataKey="purchases"
            name="purchases"
            fill="#2563EB"
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="sales"
            name="sales"
            fill={theme === "dark" ? "#F8FAFC" : "#0F172A"}
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="profit"
            name="profit"
            fill="#10B981"
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
  );
}
