"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, Loader2, FileText } from "lucide-react";
import type { InvoicePdfData } from "@/types/invoice";
import { generateInvoiceHtml } from "@/lib/invoice-html-template";

interface InvoicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceData: InvoicePdfData | null;
}

export function InvoicePreviewDialog({
  open,
  onOpenChange,
  invoiceData,
}: InvoicePreviewDialogProps) {
  const [isDownloading, setIsDownloading] = React.useState<boolean>(false);

  // Instant zero-lag HTML preview
  const htmlContent = React.useMemo(() => {
    if (!invoiceData) return "";
    return generateInvoiceHtml(invoiceData);
  }, [invoiceData]);

  const invoiceNumber = invoiceData?.invoice_number || "Invoice";
  const filename = `${invoiceNumber}.pdf`;

  const handleDownload = async () => {
    if (!invoiceData || isDownloading) return;
    setIsDownloading(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { InvoicePdfDocument } = await import("./invoice-pdf-document");

      const docElement = React.createElement(InvoicePdfDocument, { data: invoiceData });
      const instance = pdf(docElement as any);
      const blob = await instance.toBlob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error("Failed to generate PDF binary, falling back to print:", err);
      handlePrint();
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!htmlContent) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    iframe.contentWindow?.document.open();
    iframe.contentWindow?.document.write(htmlContent);
    iframe.contentWindow?.document.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error("Print error:", e);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 60000);
      }
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:w-[94vw] sm:max-w-4xl h-[92dvh] sm:h-[92vh] max-h-[92dvh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <div className="pr-8 sm:pr-0">
            <DialogTitle className="text-sm sm:text-lg font-bold text-[#0F172A] dark:text-slate-50 flex items-center gap-1.5 sm:gap-2">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-slate-300 shrink-0" />
              <span className="truncate">Invoice Preview: {invoiceNumber}</span>
            </DialogTitle>
            <DialogDescription className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
              Review document layout, line items, and totals.
            </DialogDescription>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs font-semibold min-h-[44px] sm:min-h-0 sm:h-8 rounded-xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer active:scale-[0.98]"
            >
              <Printer className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-700 dark:text-slate-300" />
              <span>Print</span>
            </Button>

            <Button
              size="sm"
              disabled={isDownloading}
              onClick={handleDownload}
              className="gap-1.5 text-xs font-semibold min-h-[44px] sm:min-h-0 sm:h-8 rounded-xl bg-[#0F172A] dark:bg-blue-600 hover:bg-[#1E293B] dark:hover:bg-blue-500 text-white cursor-pointer active:scale-[0.98]"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 animate-spin" />
              ) : (
                <Download className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              )}
              <span>{isDownloading ? "Preparing..." : "Download PDF"}</span>
            </Button>
          </div>
        </div>

        {/* Modal Body / Instant Responsive HTML Preview Frame */}
        <div className="flex-1 w-full min-w-0 relative overflow-y-auto overflow-x-auto bg-slate-100 dark:bg-slate-800 flex items-start justify-center p-2 sm:p-4">
          {htmlContent ? (
            <iframe
              srcDoc={htmlContent}
              title={`Invoice Preview - ${invoiceNumber}`}
              className="w-full max-w-full sm:max-w-[215mm] min-h-[500px] sm:h-[297mm] sm:min-h-[297mm] rounded-lg sm:rounded-sm sm:shadow-xl sm:border border-slate-300 bg-white shrink-0 sm:my-2"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-slate-600 dark:text-slate-400 p-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#14213D] dark:text-blue-400" />
              <p className="text-xs font-medium">Preparing document preview...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
