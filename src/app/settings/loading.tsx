import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
      {/* Page Header Skeleton */}
      <div className="pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
        <div className="h-7 w-48 bg-slate-300 dark:bg-slate-700 rounded mb-2" />
        <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/70 rounded" />
      </div>

      {/* DB Status Card Skeleton */}
      <Card className="border-[#E2E8F0] dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-6 w-36 bg-emerald-100 dark:bg-emerald-950/60 rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-slate-50 dark:bg-slate-900/60 rounded-lg" />
        </CardContent>
      </Card>

      {/* Form Card Skeleton */}
      <Card className="border-[#E2E8F0] dark:border-slate-800 shadow-xs p-6 space-y-4">
        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="space-y-3">
          <div className="h-10 bg-slate-100 dark:bg-slate-800/70 rounded-lg" />
          <div className="h-10 bg-slate-100 dark:bg-slate-800/70 rounded-lg" />
          <div className="h-10 bg-slate-100 dark:bg-slate-800/70 rounded-lg" />
          <div className="h-10 bg-slate-100 dark:bg-slate-800/70 rounded-lg" />
        </div>
      </Card>
    </div>
  );
}
