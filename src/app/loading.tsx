import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-pulse">
      {/* Top Welcome & Clean Action Bar Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="h-4 w-40 bg-slate-200 rounded mb-2" />
          <div className="h-8 w-64 bg-slate-300 rounded mb-2" />
          <div className="h-4 w-80 bg-slate-100 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-slate-200 rounded-lg" />
          <div className="h-9 w-28 bg-slate-200 rounded-lg" />
          <div className="h-9 w-28 bg-slate-200 rounded-lg" />
        </div>
      </div>

      {/* 4 Statistics Cards Skeleton (2x2 on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-[#E2E8F0] shadow-xs">
            <CardHeader className="p-3 sm:p-6 pb-1.5 sm:pb-2 flex flex-row items-center justify-between">
              <div className="h-4 w-20 bg-slate-200 rounded" />
              <div className="w-8 h-8 rounded-lg bg-slate-100" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="h-8 w-24 bg-slate-300 rounded mb-1" />
              <div className="h-3 w-16 bg-slate-100 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Sections Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-6 w-36 bg-slate-200 rounded" />
          <div className="h-64 bg-slate-50 border border-slate-200 rounded-xl" />
        </div>
        <div className="space-y-4">
          <div className="h-6 w-32 bg-slate-200 rounded" />
          <div className="h-64 bg-slate-50 border border-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
