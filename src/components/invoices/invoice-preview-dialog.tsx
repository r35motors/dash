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
      <DialogContent className="max-w-4xl w-[95vw] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-100">
        {/* Modal Header */}
        <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <DialogTitle className="text-lg font-bold text-[#14213D] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#14213D]" />
              <span>Invoice Preview: {invoiceNumber}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              Review document layout, line items, and totals before downloading or printing.
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs font-semibold h-8 border-slate-300 hover:bg-slate-50"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700" />
              <span>Print PDF</span>
            </Button>

            <Button
              size="sm"
              onClick={handleDownload}
              className="gap-1.5 text-xs font-semibold h-8 bg-[#14213D] hover:bg-[#1E293B] text-white"
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

        {/* Modal Body / Instant HTML Preview Frame */}
        <div className="flex-1 w-full h-full relative overflow-auto bg-slate-200 flex items-center justify-center p-2 sm:p-4">
          {htmlContent ? (
            <iframe
              srcDoc={htmlContent}
              title={`Invoice Preview - ${invoiceNumber}`}
              className="w-full h-full max-w-[215mm] min-h-[297mm] rounded-sm shadow-xl border border-slate-300 bg-white"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-slate-600">
              <Loader2 className="w-8 h-8 animate-spin text-[#14213D]" />
              <p className="text-xs font-medium">Preparing document preview...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
