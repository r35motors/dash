import { Suspense } from "react";
import { dealershipDb } from "@/lib/db";
import { InvoicesView } from "@/components/invoices/invoices-view";

interface InvoicesPageProps {
  searchParams?: Promise<{
    vehicleId?: string;
    saleId?: string;
    create?: string;
  }>;
}

async function InvoicesContent({
  searchParams,
}: {
  searchParams?: Promise<{ vehicleId?: string; saleId?: string; create?: string }>;
}) {
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

export default function InvoicesPage({ searchParams }: InvoicesPageProps) {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 text-xs">
          Loading dealership invoices & archive...
        </div>
      }
    >
      <InvoicesContent searchParams={searchParams} />
    </Suspense>
  );
}
