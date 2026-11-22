import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SalesLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Page Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100" />
            <div className="h-7 w-64 bg-slate-300 rounded" />
          </div>
          <div className="h-4 w-72 bg-slate-100 rounded mt-2" />
        </div>
        <div className="h-9 w-36 bg-slate-200 rounded-lg" />
      </div>

      {/* KPI Stats Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-[#E2E8F0] shadow-xs">
            <CardHeader className="p-3 sm:p-5 pb-1 sm:pb-2">
              <div className="h-3.5 w-24 bg-slate-200 rounded" />
            </CardHeader>
            <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0">
              <div className="h-7 w-28 bg-slate-300 rounded mb-1" />
              <div className="h-3 w-16 bg-slate-100 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales Table / List Skeleton */}
      <Card className="border-[#E2E8F0] shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-8 w-48 bg-slate-100 rounded-lg" />
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="h-4 w-40 bg-slate-200 rounded" />
                  <div className="h-3 w-28 bg-slate-100 rounded" />
                </div>
                <div className="h-5 w-24 bg-slate-200 rounded" />
                <div className="h-5 w-20 bg-emerald-100 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
