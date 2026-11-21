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
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface ChartProps {
  data: Array<{
    month: string;
    sales: number;
    revenue: number;
  }>;
}

export function SalesRevenueChart({ data }: ChartProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Loading chart...</div>;
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
          <YAxis
            stroke="#94A3B8"
            fontSize={12}
            tickLine={false}
            tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
          />
          <Tooltip
            formatter={(value: any) => [formatCurrency(value), "Revenue"]}
            contentStyle={{
              backgroundColor: "#0F172A",
              color: "#FFFFFF",
              borderRadius: "8px",
              border: "none",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="revenue" fill="#0F172A" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
