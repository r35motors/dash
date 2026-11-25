import { Card, CardContent } from "@/components/ui/card";

export default function VehiclesLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Page Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60" />
            <div className="h-7 w-64 bg-slate-300 dark:bg-slate-700 rounded" />
          </div>
          <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/70 rounded mt-2" />
        </div>
        <div className="h-9 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>

      {/* Tabs & Search Filter Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-9 w-24 bg-slate-100 dark:bg-slate-800/70 rounded-lg" />
          <div className="h-9 w-20 bg-slate-100 dark:bg-slate-800/70 rounded-lg" />
        </div>
        <div className="h-9 w-full sm:w-64 bg-slate-100 dark:bg-slate-800/70 rounded-lg" />
      </div>

      {/* Vehicles Table / Grid Skeleton */}
      <Card className="border-[#E2E8F0] dark:border-slate-800 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/60">
            <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800/70" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800/70 rounded" />
                  </div>
                </div>
                <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800/70 rounded-full" />
                <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
