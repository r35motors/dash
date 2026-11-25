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
      <div className="h-72 sm:h-80 flex items-center justify-center text-slate-400 text-sm">
        Loading comparison chart...
      </div>
    );
  }

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
    <div className="w-full overflow-hidden">
      <div className="w-full h-72 sm:h-80 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 6, left: -12, bottom: 4 }}
            barGap={2}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200/70 dark:text-slate-800" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#94A3B8"
              fontSize={10}
              interval={0}
              tickLine={false}
              tickMargin={6}
              tickFormatter={(val: string) => val.slice(0, 3)}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={10}
              tickLine={false}
              tickFormatter={formatYAxis}
              width={56}
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
                borderRadius: "10px",
                border: "1px solid #1E293B",
                fontSize: "12px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.25)",
              }}
            />
            <Legend
              verticalAlign="top"
              wrapperStyle={{ paddingBottom: "12px", fontSize: "11px" }}
              iconType="circle"
              iconSize={8}
              formatter={(val) => {
                const labelMap: Record<string, string> = {
                  purchases: "Purchases",
                  sales: "Sales Value",
                  profit: "Gross Profit",
                };
                return (
                  <span className="text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 mr-2 sm:mr-4">
                    {labelMap[val] || val}
                  </span>
                );
              }}
            />
            <Bar
              dataKey="purchases"
              name="purchases"
              fill="#2563EB"
              radius={[3, 3, 0, 0]}
              maxBarSize={26}
            />
            <Bar
              dataKey="sales"
              name="sales"
              fill={theme === "dark" ? "#818CF8" : "#0F172A"}
              radius={[3, 3, 0, 0]}
              maxBarSize={26}
            />
            <Bar
              dataKey="profit"
              name="profit"
              fill="#10B981"
              radius={[3, 3, 0, 0]}
              maxBarSize={26}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
