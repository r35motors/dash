"use client";

import * as React from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Plus,
  Download,
  Printer,
  Eye,
  Search,
  X,
  Car,
  User,
  Calendar,
  Receipt,
  Layers,
  CheckCircle2,
  TrendingUp,
  FileDown,
} from "lucide-react";
import { CreateInvoiceDialog } from "./create-invoice-dialog";
import { InvoicePreviewDialog } from "./invoice-preview-dialog";
import { DEFAULT_DEALERSHIP_LOGO } from "@/lib/constants/branding";
import type { InvoicePdfData } from "@/types/invoice";

export interface InvoiceListItem {
  id: string;
  invoice_number: string;
  vehicle_id: string;
  sale_id: string | null;
  invoice_date: string;
  invoice_total: string | number;
  invoice_snapshot: any;
  created_at: string;
  vehicle?: {
    id: string;
    vehicle_name: string;
    registration_number: string;
    owner_name: string;
    purchase_price: string | number;
    status: string;
  } | null;
  sale?: {
    id: string;
    buyer_name: string;
    selling_price: string | number;
  } | null;
  items?: Array<{
    id: string;
    description: string;
    amount: string | number;
  }>;
}

interface InvoicesViewProps {
  initialInvoices: InvoiceListItem[];
  vehicles: any[];
  sales: any[];
  settings: any;
  preselectedVehicleId?: string;
  preselectedSaleId?: string;
  initialCreateOpen?: boolean;
}

export function InvoicesView({
  initialInvoices,
  vehicles,
  sales,
  settings,
  preselectedVehicleId,
  preselectedSaleId,
  initialCreateOpen = false,
}: InvoicesViewProps) {
  const [invoices, setInvoices] = React.useState<InvoiceListItem[]>(initialInvoices);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = React.useState(Boolean(initialCreateOpen));

  // Active preview invoice
  const [previewInvoice, setPreviewInvoice] = React.useState<InvoicePdfData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState<boolean>(false);

  // Re-sync if initial prop changes
  React.useEffect(() => {
    setInvoices(initialInvoices);
  }, [initialInvoices]);

  // Open creation dialog or existing preview if preselected parameters were passed
  React.useEffect(() => {
    if (initialCreateOpen) {
      setIsCreateOpen(true);
      return;
    }
    if (preselectedSaleId || preselectedVehicleId) {
      const existing = initialInvoices.find(
        (inv) =>
          (preselectedSaleId && inv.sale_id === preselectedSaleId) ||
          (preselectedVehicleId && inv.vehicle_id === preselectedVehicleId)
      );
      if (existing) {
        const pdfData = mapInvoiceToPdfData(existing, settings);
        setPreviewInvoice(pdfData);
        setIsPreviewOpen(true);
      } else {
        setIsCreateOpen(true);
      }
    }
  }, [preselectedVehicleId, preselectedSaleId, initialCreateOpen, initialInvoices, settings]);

  // Handle new invoice added
  const handleInvoiceCreated = (newInvoice: InvoiceListItem) => {
    setInvoices((prev) => [newInvoice, ...prev]);
    // Automatically open preview for the newly generated invoice
    const pdfData = mapInvoiceToPdfData(newInvoice, settings);
    setPreviewInvoice(pdfData);
    setIsPreviewOpen(true);
  };

  // Convert an invoice record (with frozen snapshot priority and fallback to settings) to InvoicePdfData
  const mapInvoiceToPdfData = (inv: InvoiceListItem, currentSettings: any): InvoicePdfData => {
    // CRITICAL: If invoice_snapshot is present, it contains the frozen state!
    const snapshot = inv.invoice_snapshot;
    if (snapshot && typeof snapshot === "object") {
      const snapDealership = snapshot.dealership || {};
      const activeLogo =
        snapDealership.logo_path ||
        currentSettings?.logo_path ||
        DEFAULT_DEALERSHIP_LOGO;

      return {
        id: inv.id,
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        invoice_snapshot: snapshot,
        dealership: {
          ...currentSettings,
          ...snapDealership,
          logo_path: activeLogo,
        },
        buyer: snapshot.buyer || {
          name: snapshot.buyer_name || inv.sale?.buyer_name || "Customer",
        },
        vehicle: snapshot.vehicle || {
          vehicle_name: snapshot.vehicle_name || inv.vehicle?.vehicle_name || "Vehicle",
          registration_number:
            snapshot.registration_number || inv.vehicle?.registration_number || "-",
          owner_name: snapshot.owner_name || inv.vehicle?.owner_name || "-",
        },
        items: snapshot.items || inv.items,
        invoice_total: snapshot.total_amount || inv.invoice_total,
        amount_in_words: snapshot.amount_in_words,
      };
    }

    // Fallback if older invoice without complete snapshot
    const vehicleObj = inv.vehicle || vehicles.find((v) => v.id === inv.vehicle_id);
    const saleObj = inv.sale || (inv.sale_id ? sales.find((s) => s.id === inv.sale_id) : null);

    return {
      id: inv.id,
      invoice_number: inv.invoice_number,
      invoice_date: inv.invoice_date,
      dealership: currentSettings,
      buyer: {
        name: saleObj?.buyer_name || "Customer",
      },
      vehicle: vehicleObj
        ? {
            vehicle_name: vehicleObj.vehicle_name,
            registration_number: vehicleObj.registration_number,
            owner_name: vehicleObj.owner_name,
          }
        : undefined,
      items: inv.items,
      invoice_total: inv.invoice_total,
    };
  };

  // Quick Action handlers
  const handlePreviewClick = (inv: InvoiceListItem) => {
    const pdfData = mapInvoiceToPdfData(inv, settings);
    setPreviewInvoice(pdfData);
    setIsPreviewOpen(true);
  };

  const handleDownloadClick = async (inv: InvoiceListItem) => {
    try {
      const pdfData = mapInvoiceToPdfData(inv, settings);
      const { pdf } = await import("@react-pdf/renderer");
      const { InvoicePdfDocument } = await import("./invoice-pdf-document");

      const docElement = React.createElement(InvoicePdfDocument, { data: pdfData });
      const blob = await pdf(docElement as any).toBlob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${inv.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Direct download failed:", e);
      // Fallback: open preview modal
      handlePreviewClick(inv);
    }
  };

  const handlePrintClick = async (inv: InvoiceListItem) => {
    try {
      const pdfData = mapInvoiceToPdfData(inv, settings);
      const { pdf } = await import("@react-pdf/renderer");
      const { InvoicePdfDocument } = await import("./invoice-pdf-document");

      const docElement = React.createElement(InvoicePdfDocument, { data: pdfData });
      const blob = await pdf(docElement as any).toBlob();
      const url = URL.createObjectURL(blob);

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.src = url;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.focus();
            iframe.contentWindow?.print();
          } catch (err) {
            window.open(url, "_blank");
          } finally {
            setTimeout(() => {
              document.body.removeChild(iframe);
              URL.revokeObjectURL(url);
            }, 60000);
          }
        }, 300);
      };
    } catch (e) {
      console.error("Direct print failed:", e);
      handlePreviewClick(inv);
    }
  };

  // Filter invoices by query
  const filteredInvoices = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return invoices;

    return invoices.filter((inv) => {
      const num = inv.invoice_number?.toLowerCase() || "";
      const vehName =
        inv.invoice_snapshot?.vehicle?.vehicle_name?.toLowerCase() ||
        inv.vehicle?.vehicle_name?.toLowerCase() ||
        "";
      const reg =
        inv.invoice_snapshot?.vehicle?.registration_number?.toLowerCase() ||
        inv.vehicle?.registration_number?.toLowerCase() ||
        "";
      const buyer =
        inv.invoice_snapshot?.buyer?.name?.toLowerCase() ||
        inv.invoice_snapshot?.buyer_name?.toLowerCase() ||
        inv.sale?.buyer_name?.toLowerCase() ||
        "";

      return num.includes(q) || vehName.includes(q) || reg.includes(q) || buyer.includes(q);
    });
  }, [invoices, searchQuery]);

  // Metrics
  const totalInvoicedAmount = invoices.reduce(
    (acc, inv) => acc + (parseFloat(String(inv.invoice_total)) || 0),
    0
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#1E3A8A]" />
            Dealership Invoices & Bill of Sale
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate, preview, print, and archive client tax invoices with frozen historical state preservation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 bg-[#1E3A8A] hover:bg-[#1E293B] text-white shadow-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Invoice</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-[#E2E8F0] shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-slate-500 font-semibold flex items-center justify-between">
              <span>Total Invoices Issued</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0F172A]">{invoices.length}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Official bills of sale logged</p>
          </CardContent>
        </Card>

        <Card className="border border-[#E2E8F0] shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-slate-500 font-semibold flex items-center justify-between">
              <span>Total Invoiced Volume</span>
              <Receipt className="w-4 h-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0F172A]">
              {formatCurrency(totalInvoicedAmount)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Sum of all vehicle and custom charges</p>
          </CardContent>
        </Card>

        <Card className="border border-[#E2E8F0] shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-slate-500 font-semibold flex items-center justify-between">
              <span>Snapshot Guarantee</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 flex items-center gap-1.5">
              <span>100% Frozen</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Settings & vehicle updates will never alter past invoices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice number, vehicle, registration, or buyer..."
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A] bg-white transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {searchQuery
            ? `Showing ${filteredInvoices.length} of ${invoices.length} invoices`
            : `Showing all ${invoices.length} invoices`}
        </div>
      </div>

      {/* Invoices List Table: Desktop View (Hidden on mobile) */}
      <div className="hidden md:block">
        <Card className="border border-[#E2E8F0] shadow-xs overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/75">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Invoice #</TableHead>
                  <TableHead className="font-semibold text-slate-700">Date</TableHead>
                  <TableHead className="font-semibold text-slate-700">Buyer Name</TableHead>
                  <TableHead className="font-semibold text-slate-700">Vehicle Description</TableHead>
                  <TableHead className="font-semibold text-slate-700">Registration</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Total Amount</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Receipt className="w-8 h-8 text-slate-300" />
                        <p className="text-sm font-medium text-slate-600">
                          {searchQuery ? `No invoices matching "${searchQuery}"` : "No invoices created yet"}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => (searchQuery ? setSearchQuery("") : setIsCreateOpen(true))}
                          className="text-xs mt-2"
                        >
                          {searchQuery ? "Clear Search Filter" : "Generate First Invoice"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((inv) => {
                    const snap = inv.invoice_snapshot;
                    const buyerName =
                      snap?.buyer?.name ||
                      snap?.buyer_name ||
                      inv.sale?.buyer_name ||
                      "Valued Buyer";

                    const vehicleName =
                      snap?.vehicle?.vehicle_name ||
                      snap?.vehicle_name ||
                      inv.vehicle?.vehicle_name ||
                      "Vehicle";

                    const regNumber =
                      snap?.vehicle?.registration_number ||
                      snap?.registration_number ||
                      inv.vehicle?.registration_number ||
                      "-";

                    return (
                      <TableRow key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Invoice Number */}
                        <TableCell className="font-mono font-bold text-[#1E3A8A] text-xs">
                          {inv.invoice_number}
                        </TableCell>

                        {/* Date */}
                        <TableCell className="text-slate-600 text-xs whitespace-nowrap">
                          {formatDate(inv.invoice_date)}
                        </TableCell>

                        {/* Buyer Name */}
                        <TableCell className="font-medium text-[#0F172A] text-xs">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[140px]" title={buyerName}>
                              {buyerName}
                            </span>
                          </div>
                        </TableCell>

                        {/* Vehicle Name */}
                        <TableCell className="font-medium text-[#0F172A] text-xs max-w-[220px]">
                          <div className="truncate" title={vehicleName}>
                            {vehicleName}
                          </div>
                        </TableCell>

                        {/* Registration Number */}
                        <TableCell>
                          <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                            {regNumber}
                          </span>
                        </TableCell>

                        {/* Total Amount */}
                        <TableCell className="text-right font-bold text-[#0F172A] text-sm">
                          {formatCurrency(inv.invoice_total)}
                        </TableCell>

                        {/* Actions: Preview, Download PDF, Print PDF */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Preview Action */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewClick(inv)}
                              className="h-7 text-xs px-2 gap-1 border-slate-300 text-slate-700 hover:text-[#1E3A8A] hover:bg-blue-50"
                              title="Interactive PDF Preview"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#1E3A8A]" />
                              <span className="hidden sm:inline">Preview</span>
                            </Button>

                            {/* Download PDF Action */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadClick(inv)}
                              className="h-7 text-xs px-2 gap-1 border-slate-300 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">Download</span>
                            </Button>

                            {/* Print PDF Action */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrintClick(inv)}
                              className="h-7 text-xs px-2 gap-1 border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                              title="Print PDF"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                              <span className="hidden sm:inline">Print</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards View (Visible on mobile, hidden on md+) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredInvoices.length === 0 ? (
          <Card className="border border-dashed border-[#CBD5E1] bg-slate-50/50">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <Receipt className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">
                {searchQuery ? `No invoices matching "${searchQuery}"` : "No invoices created yet"}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => (searchQuery ? setSearchQuery("") : setIsCreateOpen(true))}
                className="text-xs mt-3"
              >
                {searchQuery ? "Clear Search Filter" : "Generate First Invoice"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredInvoices.map((inv) => {
            const snap = inv.invoice_snapshot;
            const buyerName =
              snap?.buyer?.name ||
              snap?.buyer_name ||
              inv.sale?.buyer_name ||
              "Valued Buyer";

            const vehicleName =
              snap?.vehicle?.vehicle_name ||
              snap?.vehicle_name ||
              inv.vehicle?.vehicle_name ||
              "Vehicle";

            const regNumber =
              snap?.vehicle?.registration_number ||
              snap?.registration_number ||
              inv.vehicle?.registration_number ||
              "-";

            return (
              <Card
                key={inv.id}
                className="border border-[#E2E8F0] shadow-xs hover:border-slate-300 transition-all overflow-hidden"
              >
                <CardContent className="p-4 space-y-3">
                  {/* Top Row: Invoice Number, Date & Paid Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-[#1E3A8A] text-sm block">
                        {inv.invoice_number}
                      </span>
                      <span className="text-slate-400 text-xs block mt-0.5">
                        {formatDate(inv.invoice_date)}
                      </span>
                    </div>
                    <Badge variant="available" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                      Paid in Full
                    </Badge>
                  </div>

                  {/* Middle: Vehicle details & Registration */}
                  <div className="pt-2 border-t border-[#E2E8F0] space-y-1">
                    <div className="font-semibold text-sm text-[#0F172A] truncate" title={vehicleName}>
                      {vehicleName}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                        {regNumber}
                      </span>
                      <span>&bull;</span>
                      <span className="truncate flex items-center gap-1 text-slate-600">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        {buyerName}
                      </span>
                    </div>
                  </div>

                  {/* Financials: Invoice Total */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] bg-slate-50/75 -mx-4 px-4 py-2">
                    <span className="text-xs text-slate-500 font-medium">Total Invoiced</span>
                    <span className="text-base font-bold text-[#0F172A]">
                      {formatCurrency(inv.invoice_total)}
                    </span>
                  </div>

                  {/* Action Buttons: 3 equal touch targets */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewClick(inv)}
                      className="h-9 text-xs px-2 gap-1.5 border-slate-300 text-slate-700 hover:text-[#1E3A8A] hover:bg-blue-50 font-medium cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#1E3A8A]" />
                      <span>Preview</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadClick(inv)}
                      className="h-9 text-xs px-2 gap-1.5 border-slate-300 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 font-medium cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>PDF</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintClick(inv)}
                      className="h-9 text-xs px-2 gap-1.5 border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-medium cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>Print</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Invoice Dialog Modal */}
      <CreateInvoiceDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        vehicles={vehicles}
        sales={sales}
        settings={settings}
        preselectedVehicleId={preselectedVehicleId}
        preselectedSaleId={preselectedSaleId}
        onInvoiceCreated={handleInvoiceCreated}
      />

      {/* Invoice PDF Preview Modal */}
      <InvoicePreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        invoiceData={previewInvoice}
      />
    </div>
  );
}
