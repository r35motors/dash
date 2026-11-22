export const dynamic = "force-dynamic";

import { dealershipDb } from "@/lib/db";
import { InvoicesView } from "@/components/invoices/invoices-view";

interface InvoicesPageProps {
  searchParams?: Promise<{
    vehicleId?: string;
    saleId?: string;
    create?: string;
  }>;
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const vehicleId = resolvedParams?.vehicleId;
  const saleId = resolvedParams?.saleId;
  const initialCreateOpen = resolvedParams?.create === "true";

  const [invoices, vehicles, sales, settings] = await Promise.all([
    dealershipDb.invoices.getAll(),
    dealershipDb.vehicles.getAll(),
    dealershipDb.sales.getAll(),
    dealershipDb.settings.get(),
  ]);

  return (
    <InvoicesView
      initialInvoices={invoices as any}
      vehicles={vehicles as any}
      sales={sales as any}
      settings={settings as any}
      preselectedVehicleId={vehicleId}
      preselectedSaleId={saleId}
      initialCreateOpen={initialCreateOpen}
    />
  );
}
