import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Top Welcome & Clean Action Bar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="h-3 w-32 bg-slate-200 rounded-md mb-2" />
          <div className="h-7 w-56 bg-slate-300 rounded-lg mb-2" />
          <div className="h-3 w-72 bg-slate-100 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9.5 w-28 bg-slate-200 rounded-xl" />
          <div className="h-9.5 w-28 bg-slate-200 rounded-xl" />
          <div className="h-9.5 w-28 bg-slate-200 rounded-xl" />
        </div>
      </div>

      {/* 4 Statistics Cards Skeleton (2x2 on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-premium">
            <div className="flex items-center justify-between pb-3">
              <div className="h-3 w-20 bg-slate-200 rounded-md" />
              <div className="w-8 h-8 rounded-xl bg-slate-100" />
            </div>
            <div className="h-7 w-28 bg-slate-300 rounded-lg mb-2" />
            <div className="h-2.5 w-20 bg-slate-100 rounded-md" />
          </Card>
        ))}
      </div>

      {/* Recent Activity Sections Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="h-5 w-40 bg-slate-200 rounded-md" />
          <div className="h-72 bg-white border border-slate-200/80 rounded-2xl shadow-premium" />
        </div>
        <div className="space-y-3">
          <div className="h-5 w-40 bg-slate-200 rounded-md" />
          <div className="h-72 bg-white border border-slate-200/80 rounded-2xl shadow-premium" />
        </div>
      </div>
    </div>
  );
}
