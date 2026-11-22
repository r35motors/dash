export const dynamic = "force-dynamic";

import { dealershipDb } from "@/lib/db";
import { AnalyticsView } from "@/components/analytics/analytics-view";

interface AnalyticsPageProps {
  searchParams?: Promise<{ year?: string; month?: string }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const year = resolvedParams?.year ? parseInt(resolvedParams.year, 10) : undefined;
  const month = resolvedParams?.month ? parseInt(resolvedParams.month, 10) : undefined;

  const data = await dealershipDb.analytics.getOverview(year, month);

  return <AnalyticsView initialData={data as any} />;
}
