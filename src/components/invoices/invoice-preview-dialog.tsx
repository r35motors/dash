"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, Loader2, FileText, CheckCircle2, ExternalLink } from "lucide-react";
import { InvoicePdfData } from "./invoice-pdf-document";

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
        console.error("Failed to render PDF preview:", err);
        if (isMounted) {
          setError(err?.message || "Could not generate PDF preview.");
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
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    // Create an invisible iframe to trigger the native browser print dialog
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.src = pdfUrl;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          // Fallback to opening in new tab
          window.open(pdfUrl, "_blank");
        } finally {
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 60000);
        }
      }, 300);
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-100">
        {/* Modal Header */}
        <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <DialogTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#1E3A8A]" />
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
              disabled={!pdfUrl || isGenerating}
              className="gap-1.5 text-xs font-semibold h-8 border-slate-300"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700" />
              <span>Print PDF</span>
            </Button>

            <Button
              size="sm"
              onClick={handleDownload}
              disabled={!pdfUrl || isGenerating}
              className="gap-1.5 text-xs font-semibold h-8 bg-[#1E3A8A] hover:bg-[#1E293B] text-white"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </Button>
          </div>
        </div>

        {/* Modal Body / PDF Frame */}
        <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-200 flex items-center justify-center p-2 sm:p-4">
          {isGenerating && (
            <div className="flex flex-col items-center justify-center gap-2 text-slate-600">
              <Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A]" />
              <p className="text-xs font-medium">Generating professional A4 PDF...</p>
            </div>
          )}

          {error && !isGenerating && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200 max-w-md text-center space-y-3">
              <p className="text-xs text-red-600 font-semibold">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          )}

          {pdfUrl && !isGenerating && (
            <iframe
              src={pdfUrl}
              title={`Invoice Preview - ${invoiceNumber}`}
              className="w-full h-full rounded-md shadow-md border border-slate-300 bg-white"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
