import { Suspense } from "react";
import { dealershipDb } from "@/lib/db";
import { AnalyticsView } from "@/components/analytics/analytics-view";

interface AnalyticsPageProps {
  searchParams?: Promise<{ year?: string; month?: string }>;
}

async function AnalyticsContent({
  searchParams,
}: {
  searchParams?: Promise<{ year?: string; month?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const year = resolvedParams?.year ? parseInt(resolvedParams.year, 10) : undefined;
  const month = resolvedParams?.month ? parseInt(resolvedParams.month, 10) : undefined;

  const data = await dealershipDb.analytics.getOverview(year, month);

  return <AnalyticsView initialData={data as any} />;
}

export default function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 text-xs">
          Loading dealership analytics and reports...
        </div>
      }
    >
      <AnalyticsContent searchParams={searchParams} />
    </Suspense>
  );
}
