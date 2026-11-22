"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, numberToIndianWords } from "@/lib/utils";
import {
  FileText,
  Plus,
  Trash2,
  Car,
  User,
  Calendar,
  Eye,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  Wrench,
  ShieldCheck,
  Paintbrush,
  Receipt,
  FileCheck,
  Lock,
} from "lucide-react";
import { InvoicePreviewDialog } from "./invoice-preview-dialog";
import type { InvoicePdfData } from "@/types/invoice";

export interface CustomLineItem {
  id: string;
  description: string;
  amount: number | string;
}

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: Array<{
    id: string;
    vehicle_name: string;
    registration_number: string;
    owner_name: string;
    purchase_price: string | number;
    status: string;
  }>;
  sales: Array<{
    id: string;
    vehicle_id: string;
    buyer_name: string;
    selling_price: string | number;
    sale_date: string;
  }>;
  settings: {
    id?: string;
    business_name: string;
    logo_path?: string | null;
    address: string;
    contact_number_1: string;
    contact_number_2?: string | null;
    invoice_prefix: string;
  };
  preselectedVehicleId?: string;
  preselectedSaleId?: string;
  nextInvoiceNumber?: string;
  onInvoiceCreated: (newInvoice: any) => void;
}

export function CreateInvoiceDialog({
  open,
  onOpenChange,
  vehicles,
  sales,
  settings,
  preselectedVehicleId,
  preselectedSaleId,
  nextInvoiceNumber,
  onInvoiceCreated,
}: CreateInvoiceDialogProps) {
  // Dealership info from settings
  const prefix = settings?.invoice_prefix || "INV";
  const defaultNumber = nextInvoiceNumber || `${prefix}-${new Date().getFullYear()}-0001`;

  // Form State
  const [invoiceNumber, setInvoiceNumber] = React.useState<string>(defaultNumber);
  const [invoiceDate, setInvoiceDate] = React.useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedVehicleId, setSelectedVehicleId] = React.useState<string>(
    preselectedVehicleId || ""
  );
  const [buyerName, setBuyerName] = React.useState<string>("");
  const [vehicleSellingPrice, setVehicleSellingPrice] = React.useState<number | string>("");
  const [customItems, setCustomItems] = React.useState<CustomLineItem[]>([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);

  // Sync when dialog opens or props change
  React.useEffect(() => {
    if (open) {
      setErrorMessage(null);
      if (nextInvoiceNumber) {
        setInvoiceNumber(nextInvoiceNumber);
      } else {
        fetch("/api/invoices/next-number")
          .then((r) => r.json())
          .then((d) => {
            if (d.next_number) setInvoiceNumber(d.next_number);
          })
          .catch(() => {});
      }
      if (preselectedVehicleId) {
        setSelectedVehicleId(preselectedVehicleId);
      }
    }
  }, [open, nextInvoiceNumber, preselectedVehicleId]);

  // When selected vehicle changes, auto-populate details & find matching sale
  React.useEffect(() => {
    if (!selectedVehicleId) return;

    const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
    if (!vehicle) return;

    // Check if there is an existing sale for this vehicle
    const sale =
      (preselectedSaleId && sales.find((s) => s.id === preselectedSaleId)) ||
      sales.find((s) => s.vehicle_id === selectedVehicleId);

    if (sale) {
      setBuyerName(sale.buyer_name || "");
      setVehicleSellingPrice(sale.selling_price || "");
    } else {
      // If no sale recorded, allow user to set price, or use purchase price as guide
      if (!vehicleSellingPrice) {
        setVehicleSellingPrice(vehicle.purchase_price || "");
      }
    }
  }, [selectedVehicleId, preselectedSaleId, vehicles, sales]);

  const selectedVehicle = React.useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId) || null;
  }, [vehicles, selectedVehicleId]);

  const matchedSale = React.useMemo(() => {
    if (!selectedVehicleId) return null;
    return (
      (preselectedSaleId && sales.find((s) => s.id === preselectedSaleId)) ||
      sales.find((s) => s.vehicle_id === selectedVehicleId) ||
      null
    );
  }, [sales, selectedVehicleId, preselectedSaleId]);

  // Handle adding custom line item
  const handleAddCustomItem = (presetDescription?: string, defaultAmount?: number) => {
    const newItem: CustomLineItem = {
      id: Math.random().toString(36).substring(2, 9),
      description: presetDescription || "",
      amount: defaultAmount || "",
    };
    setCustomItems((prev) => [...prev, newItem]);
  };

  const handleUpdateItem = (id: string, field: "description" | "amount", value: string | number) => {
    setCustomItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    setCustomItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculate Invoice Total
  const vehiclePriceNum = parseFloat(String(vehicleSellingPrice)) || 0;
  const customItemsTotal = customItems.reduce((acc, it) => {
    const amt = parseFloat(String(it.amount)) || 0;
    return acc + amt;
  }, 0);
  const invoiceTotal = vehiclePriceNum + customItemsTotal;

  // Amount in Indian numbering system words
  const amountInWords = React.useMemo(() => {
    return numberToIndianWords(invoiceTotal);
  }, [invoiceTotal]);

  // Build the complete line items list
  const fullItemsList = React.useMemo(() => {
    const items: Array<{ description: string; amount: number | string }> = [];
    if (selectedVehicle) {
      items.push({
        description: `Vehicle Purchase: ${selectedVehicle.vehicle_name} (${selectedVehicle.registration_number})`,
        amount: vehiclePriceNum,
      });
    } else {
      items.push({
        description: "Vehicle Sale Consideration",
        amount: vehiclePriceNum,
      });
    }

    for (const cItem of customItems) {
      if (cItem.description.trim()) {
        items.push({
          description: cItem.description.trim(),
          amount: parseFloat(String(cItem.amount)) || 0,
        });
      }
    }
    return items;
  }, [selectedVehicle, vehiclePriceNum, customItems]);

  // Construct PDF preview payload
  const currentInvoiceData: InvoicePdfData = React.useMemo(() => {
    return {
      invoice_number: invoiceNumber.trim() || defaultNumber,
      invoice_date: invoiceDate,
      dealership: {
        business_name: settings?.business_name || "R35 MOTORS",
        logo_path: settings?.logo_path,
        address: settings?.address || "",
        contact_number_1: settings?.contact_number_1 || "",
        contact_number_2: settings?.contact_number_2 || null,
        invoice_prefix: settings?.invoice_prefix || "INV",
      },
      buyer: {
        name: buyerName.trim() || "Customer",
      },
      vehicle: selectedVehicle
        ? {
            id: selectedVehicle.id,
            vehicle_name: selectedVehicle.vehicle_name,
            registration_number: selectedVehicle.registration_number,
            owner_name: selectedVehicle.owner_name,
            purchase_price: selectedVehicle.purchase_price,
            selling_price: vehiclePriceNum,
          }
        : {
            vehicle_name: "Selected Vehicle",
            registration_number: "-",
            owner_name: "-",
          },
      items: fullItemsList,
      invoice_total: invoiceTotal,
      amount_in_words: amountInWords,
    };
  }, [
    invoiceNumber,
    defaultNumber,
    invoiceDate,
    settings,
    buyerName,
    selectedVehicle,
    vehiclePriceNum,
    fullItemsList,
    invoiceTotal,
    amountInWords,
  ]);

  // Submit invoice creation
  const handleSaveInvoice = async () => {
    setErrorMessage(null);

    if (!selectedVehicleId) {
      setErrorMessage("Please select a vehicle from inventory.");
      return;
    }
    if (!invoiceNumber.trim()) {
      setErrorMessage("Invoice number is required.");
      return;
    }
    if (!buyerName.trim()) {
      setErrorMessage("Buyer name is required.");
      return;
    }
    if (invoiceTotal <= 0) {
      setErrorMessage("Invoice total must be greater than zero.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create complete frozen snapshot
      const invoiceSnapshot = {
        invoice_number: invoiceNumber.trim(),
        invoice_date: invoiceDate,
        dealership: {
          business_name: settings.business_name,
          logo_path: settings.logo_path,
          address: settings.address,
          contact_number_1: settings.contact_number_1,
          contact_number_2: settings.contact_number_2,
          invoice_prefix: settings.invoice_prefix,
        },
        buyer: {
          name: buyerName.trim(),
        },
        vehicle: {
          id: selectedVehicle!.id,
          vehicle_name: selectedVehicle!.vehicle_name,
          registration_number: selectedVehicle!.registration_number,
          owner_name: selectedVehicle!.owner_name,
          purchase_price: selectedVehicle!.purchase_price,
          selling_price: vehiclePriceNum,
        },
        items: fullItemsList,
        total_amount: invoiceTotal,
        amount_in_words: amountInWords,
        created_at: new Date().toISOString(),
      };

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: selectedVehicleId,
          sale_id: matchedSale ? matchedSale.id : null,
          invoice_number: invoiceNumber.trim(),
          invoice_date: invoiceDate,
          invoice_total: invoiceTotal,
          invoice_snapshot: invoiceSnapshot,
          items: fullItemsList,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create invoice");
      }

      // Notify parent
      onInvoiceCreated(data);
      onOpenChange(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-white">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/75 shrink-0">
            <DialogTitle className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#1E3A8A]" />
              <span>Create Official Tax Invoice</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Generate a legally compliant tax invoice and bill of sale with itemized charges and frozen snapshot.
            </DialogDescription>
          </div>

          {/* Form Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Dealership Banner Preview */}
            <div className="p-3.5 rounded-lg bg-blue-50/50 border border-blue-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-[#1E3A8A]" />
                <div>
                  <span className="font-semibold text-[#0F172A]">
                    {settings?.business_name || "Dealership"}
                  </span>
                  <span className="text-slate-500 block text-[11px]">
                    {settings?.address || "Configured Dealership Address"} &bull; {settings?.contact_number_1}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                Prefix: {prefix}
              </span>
            </div>

            {/* Section 1: Invoice Meta (Number & Date) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="invoice_number" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    Invoice Number <span className="text-red-500">*</span>
                  </Label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Lock className="w-2.5 h-2.5" />
                    Auto Numbering
                  </span>
                </div>
                <div className="relative mt-1">
                  <Input
                    id="invoice_number"
                    value={invoiceNumber || "Generating..."}
                    readOnly
                    disabled
                    tabIndex={-1}
                    className="font-mono text-xs font-bold bg-slate-100/90 text-slate-800 border-slate-300 cursor-not-allowed select-none pr-8"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block font-medium">
                  Automatically generated sequential numbering (manual editing disabled).
                </span>
              </div>

              <div>
                <Label htmlFor="invoice_date" className="text-xs font-semibold text-slate-700">
                  Invoice Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="invoice_date"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            {/* Section 2: Vehicle Selection & Buyer Info */}
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5" />
                <span>Vehicle & Client Particulars</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Vehicle Selection dropdown */}
                <div>
                  <Label htmlFor="vehicle_select" className="text-xs font-semibold text-slate-700">
                    Select Inventory Vehicle <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="vehicle_select"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full mt-1 h-9 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                  >
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicle_name} ({v.registration_number}) - {v.status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Buyer Name input */}
                <div>
                  <Label htmlFor="buyer_name" className="text-xs font-semibold text-slate-700">
                    Buyer Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="buyer_name"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Enter full name of buyer"
                    className="mt-1 text-xs font-medium"
                  />
                  {matchedSale && (
                    <span className="text-[10px] text-emerald-600 mt-0.5 block flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Auto-filled from recorded sale record
                    </span>
                  )}
                </div>
              </div>

              {/* Selected Vehicle Overview Box */}
              {selectedVehicle && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">Model</span>
                    <span className="font-semibold text-slate-900 truncate block">
                      {selectedVehicle.vehicle_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">Registration</span>
                    <span className="font-mono font-semibold text-[#1E3A8A]">
                      {selectedVehicle.registration_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">Previous Owner</span>
                    <span className="text-slate-700 font-medium truncate block">
                      {selectedVehicle.owner_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">Purchase Cost (Ref)</span>
                    <span className="text-slate-500 font-medium">
                      {formatCurrency(selectedVehicle.purchase_price)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Itemized Charges & Custom Line Items */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Itemized Invoice Charges</span>
                </h4>

                {/* Quick Add Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium mr-1 hidden sm:inline">Add:</span>
                  <button
                    type="button"
                    onClick={() => handleAddCustomItem("Painting & Body Refurbishment", 15000)}
                    className="inline-flex items-center gap-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    <Paintbrush className="w-3 h-3 text-purple-600" />
                    <span>Painting</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddCustomItem("Mechanical & Service Repair Work", 12000)}
                    className="inline-flex items-center gap-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    <Wrench className="w-3 h-3 text-amber-600" />
                    <span>Repair work</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddCustomItem("Comprehensive Insurance Policy Transfer", 18500)}
                    className="inline-flex items-center gap-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                    <span>Insurance transfer</span>
                  </button>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100/75 px-3 py-2 grid grid-cols-12 gap-2 text-[11px] font-semibold text-slate-600 uppercase">
                  <span className="col-span-1 text-center">#</span>
                  <span className="col-span-7">Description</span>
                  <span className="col-span-3 text-right">Amount (INR)</span>
                  <span className="col-span-1 text-right">Action</span>
                </div>

                <div className="divide-y divide-slate-100 bg-white">
                  {/* Default First Item: Vehicle Selling Price */}
                  <div className="p-3 grid grid-cols-12 gap-2 items-center bg-blue-50/20">
                    <span className="col-span-1 text-center text-xs font-semibold text-slate-400">1</span>
                    <div className="col-span-7">
                      <span className="text-xs font-semibold text-[#0F172A] block">
                        Vehicle Consideration: {selectedVehicle?.vehicle_name || "Selected Vehicle"}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        Registration: {selectedVehicle?.registration_number || "-"}
                      </span>
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min="0"
                        step="1000"
                        value={vehicleSellingPrice}
                        onChange={(e) => setVehicleSellingPrice(e.target.value)}
                        placeholder="Selling Price"
                        className="text-right text-xs font-bold text-[#0F172A] h-8"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      <span className="text-[10px] text-slate-400 italic">Fixed</span>
                    </div>
                  </div>

                  {/* Custom Added Items */}
                  {customItems.map((item, index) => (
                    <div key={item.id} className="p-3 grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-1 text-center text-xs font-semibold text-slate-400">
                        {index + 2}
                      </span>
                      <div className="col-span-7">
                        <Input
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                          placeholder="e.g. Painting, Repair work, RTO fee..."
                          className="text-xs h-8"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min="0"
                          step="500"
                          value={item.amount}
                          onChange={(e) => handleUpdateItem(item.id, "amount", e.target.value)}
                          placeholder="Amount"
                          className="text-right text-xs font-semibold h-8"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Item Row Button */}
                <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddCustomItem()}
                    className="text-xs h-7 gap-1 border-dashed text-slate-700"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Custom Item</span>
                  </Button>

                  <span className="text-[11px] text-slate-500">
                    {customItems.length} custom line {customItems.length === 1 ? "item" : "items"} added
                  </span>
                </div>
              </div>
            </div>

            {/* Section 4: Live Invoice Total & Indian Words */}
            <div className="p-4 bg-slate-900 text-white rounded-xl shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Calculated Invoice Total
                </span>
                <span className="text-2xl font-bold text-white tracking-tight">
                  {formatCurrency(invoiceTotal)}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-blue-400 block tracking-wider">
                  Amount in Words (Indian Numbering):
                </span>
                <p className="text-xs font-medium text-slate-200 italic mt-0.5">
                  &ldquo;{amountInWords}&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs w-full sm:w-auto h-9 cursor-pointer"
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(true)}
                disabled={!selectedVehicleId || invoiceTotal <= 0}
                className="flex-1 sm:flex-initial gap-1.5 text-xs font-semibold h-9 border-slate-300 text-slate-800 hover:bg-slate-100 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-[#1E3A8A]" />
                <span>Preview PDF</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleSaveInvoice}
                disabled={isSubmitting || !selectedVehicleId || invoiceTotal <= 0}
                className="flex-1 sm:flex-initial gap-1.5 text-xs font-semibold h-9 bg-[#1E3A8A] hover:bg-[#1E293B] text-white cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Save & Generate</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Interactive PDF Preview Modal */}
      <InvoicePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        invoiceData={currentInvoiceData}
      />
    </>
  );
}
