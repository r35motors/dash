"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  // Generate HTML preview content
  const htmlContent = React.useMemo(() => {
    if (!invoiceData) return "";
    return generateInvoiceHtml(invoiceData);
  }, [invoiceData]);

  React.useEffect(() => {
    if (!open || !invoiceData) {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
      return;
    }

    let isMounted = true;
    let createdUrl: string | null = null;

    async function generatePdf() {
      setIsGenerating(true);
      setError(null);
      try {
        const { pdf } = await import("@react-pdf/renderer");
        const { InvoicePdfDocument } = await import("./invoice-pdf-document");

        const docElement = React.createElement(InvoicePdfDocument, { data: invoiceData! });
        const instance = pdf(docElement as any);
        const blob = await instance.toBlob();

        if (isMounted) {
          createdUrl = URL.createObjectURL(blob);
          setPdfUrl(createdUrl);
        }
      } catch (err: any) {
        console.error("Failed to render PDF document binary:", err);
        if (isMounted) {
          setError(err?.message || "Could not generate PDF binary.");
        }
      } finally {
        if (isMounted) {
          setIsGenerating(false);
        }
      }
    }

    generatePdf();

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [open, invoiceData]);

  const invoiceNumber = invoiceData?.invoice_number || "Invoice";
  const filename = `${invoiceNumber}.pdf`;

  const handleDownload = () => {
    if (pdfUrl) {
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Direct print-to-pdf fallback
      handlePrint();
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
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-[94vw] sm:max-w-4xl h-[95dvh] sm:h-[92vh] max-h-[96dvh] sm:max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <div className="pr-6 sm:pr-0">
            <DialogTitle className="text-sm sm:text-lg font-bold text-[#0F172A] dark:text-slate-50 flex items-center gap-1.5 sm:gap-2">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-slate-300 shrink-0" />
              <span className="truncate">Invoice Preview: {invoiceNumber}</span>
            </DialogTitle>
            <DialogDescription className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
              Review document layout, line items, and totals.
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial gap-1.5 text-xs font-semibold h-8 rounded-xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer active:scale-[0.98]"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
              <span>Print PDF</span>
            </Button>

            <Button
              size="sm"
              onClick={handleDownload}
              className="flex-1 sm:flex-initial gap-1.5 text-xs font-semibold h-8 rounded-xl bg-[#0F172A] dark:bg-blue-600 hover:bg-[#1E293B] dark:hover:bg-blue-500 text-white cursor-pointer active:scale-[0.98]"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download PDF</span>
            </Button>
          </div>
        </div>

        {/* Modal Body / Instant Responsive HTML Preview Frame */}
        <div className="flex-1 w-full relative overflow-y-auto overflow-x-hidden bg-slate-100 dark:bg-slate-800 flex items-start justify-center p-0 sm:p-4">
          {htmlContent ? (
            <iframe
              srcDoc={htmlContent}
              title={`Invoice Preview - ${invoiceNumber}`}
              className="w-full sm:max-w-[215mm] min-h-[500px] sm:h-[297mm] sm:min-h-[297mm] rounded-none sm:rounded-sm sm:shadow-xl sm:border border-slate-300 bg-white dark:bg-slate-900 shrink-0 sm:my-2"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-slate-600 dark:text-slate-400 p-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#14213D]" />
              <p className="text-xs font-medium">Preparing document preview...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
