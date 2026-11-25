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
  nextInvoiceNumber?: string;
  preselectedVehicleId?: string;
  preselectedSaleId?: string;
  initialCreateOpen?: boolean;
}

export function InvoicesView({
  initialInvoices,
  vehicles,
  sales,
  settings,
  nextInvoiceNumber,
  preselectedVehicleId,
  preselectedSaleId,
  initialCreateOpen = false,
}: InvoicesViewProps) {
  const [invoices, setInvoices] = React.useState<InvoiceListItem[]>(initialInvoices);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = React.useState(Boolean(initialCreateOpen));
  const [currentNextNumber, setCurrentNextNumber] = React.useState<string>(nextInvoiceNumber || "");

  // Refresh latest auto-assigned sequence number
  const refreshNextNumber = React.useCallback(async () => {
    try {
      const res = await fetch("/api/invoices/next-number");
      if (res.ok) {
        const data = await res.json();
        if (data.next_number) setCurrentNextNumber(data.next_number);
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    if (isCreateOpen) {
      refreshNextNumber();
    }
  }, [isCreateOpen, refreshNextNumber]);

  React.useEffect(() => {
    if (nextInvoiceNumber) {
      setCurrentNextNumber(nextInvoiceNumber);
    }
  }, [nextInvoiceNumber]);

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
    refreshNextNumber();
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-slate-50 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-slate-800 dark:text-slate-200" />
            Dealership Invoices & Bills of Sale
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate, preview, print, and archive client tax invoices with frozen historical state preservation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-xs font-semibold cursor-pointer rounded-xl h-9.5 px-4 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Invoice</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-premium hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="text-xs uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider flex items-center justify-between">
            <span>Invoices Issued</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-slate-50 mt-2.5 tabular-nums">{invoices.length}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Official bills of sale logged</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-premium hover:border-slate-300 dark:hover:border-slate-700 transition min-w-0">
          <div className="text-xs uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider flex items-center justify-between gap-2">
            <span>Total Invoiced Volume</span>
            <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          </div>
          <div className="text-xl lg:text-2xl xl:text-3xl font-bold text-[#0F172A] dark:text-slate-50 mt-2.5 tabular-nums truncate">
            {formatCurrency(totalInvoicedAmount)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Sum of vehicle and custom line charges</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 sm:top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            aria-label="Search invoice number, vehicle, or buyer"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice #, vehicle, buyer..."
            className="w-full pl-9 pr-9 py-2.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-[#0F172A] dark:text-slate-50 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all placeholder:text-slate-400 min-h-[44px] sm:min-h-0"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-1.5 top-1.5 sm:top-1 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {searchQuery
            ? `Showing ${filteredInvoices.length} of ${invoices.length} invoices`
            : `Showing all ${invoices.length} invoices`}
        </div>
      </div>

      {/* Invoices List Table: Desktop View (Hidden on mobile) */}
      <div className="hidden md:block">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-premium overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800">
              <TableRow>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3 px-2.5 whitespace-nowrap">Invoice #</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3 px-2.5 whitespace-nowrap">Date</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3 px-2.5 whitespace-nowrap">Client Buyer</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3 px-2.5 whitespace-nowrap">Vehicle</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3 px-2.5 whitespace-nowrap">Registration</TableHead>
                <TableHead className="text-right font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3 px-2.5 whitespace-nowrap">Amount</TableHead>
                <TableHead className="text-right font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3 px-2.5 whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {searchQuery ? `No invoices matching "${searchQuery}"` : "No invoices created yet"}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => (searchQuery ? setSearchQuery("") : setIsCreateOpen(true))}
                        className="text-xs mt-2 rounded-xl"
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
                    <TableRow key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                      {/* Invoice Number */}
                      <TableCell className="font-mono font-bold text-xs py-3 px-2.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 font-semibold whitespace-nowrap inline-block">
                          {inv.invoice_number}
                        </span>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-slate-600 dark:text-slate-400 text-xs py-3 px-2.5 whitespace-nowrap tabular-nums">
                        {formatDate(inv.invoice_date)}
                      </TableCell>

                      {/* Buyer Name */}
                      <TableCell className="font-medium text-[#0F172A] dark:text-slate-50 text-xs py-3 px-2.5">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[105px] font-semibold" title={buyerName}>
                            {buyerName}
                          </span>
                        </div>
                      </TableCell>

                      {/* Vehicle Name */}
                      <TableCell className="font-medium text-[#0F172A] dark:text-slate-50 text-xs py-3 px-2.5 max-w-[130px]">
                        <div className="truncate font-medium" title={vehicleName}>
                          {vehicleName}
                        </div>
                      </TableCell>

                      {/* Registration Number */}
                      <TableCell className="py-3 px-2.5 whitespace-nowrap">
                        <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold border border-slate-200/70 dark:border-slate-700/70 whitespace-nowrap inline-block">
                          {regNumber}
                        </span>
                      </TableCell>

                      {/* Total Amount */}
                      <TableCell className="text-right font-bold text-[#0F172A] dark:text-slate-50 text-xs xl:text-sm py-3 px-2.5 whitespace-nowrap tabular-nums">
                        {formatCurrency(inv.invoice_total)}
                      </TableCell>

                      {/* Actions: Preview, Download PDF, Print PDF */}
                      <TableCell className="text-right py-3 px-2.5 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Preview Action */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewClick(inv)}
                            className="h-7.5 text-[11px] px-2 gap-1 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg active:scale-95"
                            title="Interactive PDF Preview"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                            <span>Preview</span>
                          </Button>

                          {/* Download PDF Action */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadClick(inv)}
                            className="h-7.5 text-[11px] px-2 gap-1 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950/50 rounded-lg active:scale-95"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-600" />
                            <span>PDF</span>
                          </Button>

                          {/* Print PDF Action */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintClick(inv)}
                            className="h-7.5 text-[11px] px-2 gap-1 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg active:scale-95"
                            title="Print PDF"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                            <span>Print</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Cards View (Visible on mobile, hidden on md+) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredInvoices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 dark:bg-slate-900/50 p-8 text-center flex flex-col items-center justify-center">
            <Receipt className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {searchQuery ? `No invoices matching "${searchQuery}"` : "No invoices created yet"}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => (searchQuery ? setSearchQuery("") : setIsCreateOpen(true))}
              className="text-xs mt-3 rounded-xl"
            >
              {searchQuery ? "Clear Search Filter" : "Generate First Invoice"}
            </Button>
          </div>
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
              <div
                key={inv.id}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-premium hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
              >
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
                  <Badge variant="available" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-700/70">
                    Issued
                  </Badge>
                </div>

                {/* Middle: Vehicle details & Registration */}
                <div className="pt-2.5 border-t border-slate-100 space-y-1">
                  <div className="font-semibold text-sm text-[#0F172A] dark:text-slate-50 truncate" title={vehicleName}>
                    {vehicleName}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold border border-slate-200/70 dark:border-slate-700/70">
                      {regNumber}
                    </span>
                    <span>&bull;</span>
                    <span className="truncate flex items-center gap-1 text-slate-600 dark:text-slate-400">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      {buyerName}
                    </span>
                  </div>
                </div>

                {/* Financials: Invoice Total */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/70 -mx-4 px-4 py-2.5">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Invoiced</span>
                  <span className="text-base font-bold text-[#0F172A] dark:text-slate-50 tabular-nums">
                    {formatCurrency(inv.invoice_total)}
                  </span>
                </div>

                {/* Action Buttons: 3 equal touch targets */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreviewClick(inv)}
                    className="h-9 text-xs px-2 gap-1.5 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer rounded-xl active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                    <span>Preview</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadClick(inv)}
                    className="h-9 text-xs px-2 gap-1.5 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950/50 font-medium cursor-pointer rounded-xl active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>PDF</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrintClick(inv)}
                    className="h-9 text-xs px-2 gap-1.5 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer rounded-xl active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                    <span>Print</span>
                  </Button>
                </div>
              </div>
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
        nextInvoiceNumber={currentNextNumber}
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
