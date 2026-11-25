"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  BadgeDollarSign,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Tag,
  TrendingUp,
  TrendingDown,
  Calendar,
  Car,
  ReceiptText,
} from "lucide-react";

export interface AvailableVehicleOption {
  id: string;
  vehicle_name: string;
  registration_number: string;
  owner_name: string;
  purchase_price: string | number;
  status: string;
}

interface AddSaleDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  availableVehicles: AvailableVehicleOption[];
  preselectedVehicleId?: string;
  onSaleCompleted?: (sale: any) => void;
}

export function AddSaleDialog({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  availableVehicles,
  preselectedVehicleId,
  onSaleCompleted,
}: AddSaleDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen || setInternalOpen;

  // Form State
  const [selectedVehicleId, setSelectedVehicleId] = React.useState<string>(
    preselectedVehicleId || ""
  );
  const [buyerName, setBuyerName] = React.useState("");
  const [sellingPrice, setSellingPrice] = React.useState("");
  const [saleDate, setSaleDate] = React.useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Sync with preselectedVehicleId whenever it changes or dialog opens
  React.useEffect(() => {
    if (preselectedVehicleId) {
      setSelectedVehicleId(preselectedVehicleId);
    }
  }, [preselectedVehicleId]);

  // If preselected vehicle is passed, also open if controlled is not set
  React.useEffect(() => {
    if (preselectedVehicleId && controlledOpen === undefined) {
      setInternalOpen(true);
    }
  }, [preselectedVehicleId, controlledOpen]);

  const resetForm = () => {
    setSelectedVehicleId(preselectedVehicleId || "");
    setBuyerName("");
    setSellingPrice("");
    setSaleDate(new Date().toISOString().split("T")[0]);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  // Find currently selected vehicle
  const selectedVehicle = React.useMemo(() => {
    return availableVehicles.find((v) => v.id === selectedVehicleId) || null;
  }, [availableVehicles, selectedVehicleId]);

  // Calculate profit and margin percentage in real-time
  const profitStats = React.useMemo(() => {
    if (!selectedVehicle) return null;
    const purchase = parseFloat(String(selectedVehicle.purchase_price)) || 0;
    const selling = parseFloat(sellingPrice);

    if (isNaN(selling) || selling <= 0) return null;

    const profit = selling - purchase;
    const marginPercent =
      purchase > 0 ? ((profit / purchase) * 100).toFixed(1) : "0.0";

    return {
      profit,
      marginPercent,
      isPositive: profit > 0,
      isBreakEven: profit === 0,
    };
  }, [selectedVehicle, sellingPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedVehicleId) {
      setErrorMessage("Please select an available vehicle to sell.");
      return;
    }

    const trimmedBuyer = buyerName.trim();
    if (!trimmedBuyer) {
      setErrorMessage("Buyer name is required.");
      return;
    }

    const priceNum = parseFloat(sellingPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMessage("Selling price must be a valid positive number.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: selectedVehicleId,
          buyer_name: trimmedBuyer,
          selling_price: priceNum,
          sale_date: saleDate || new Date().toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || `Failed to record sale (${res.status} error)`);
        return;
      }

      setSuccessMessage("Vehicle sale recorded successfully! Vehicle marked as Sold.");
      if (onSaleCompleted) {
        onSaleCompleted(data);
      }
      router.refresh();

      setTimeout(() => {
        handleOpenChange(false);
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const parsedSellingPrice = parseFloat(sellingPrice);
  const formattedSellingPreview =
    !isNaN(parsedSellingPrice) && parsedSellingPrice > 0
      ? formatCurrency(parsedSellingPrice)
      : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className="gap-2 bg-[#0F172A] dark:bg-blue-600 hover:bg-[#1E293B] dark:hover:bg-blue-500 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Record New Sale</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <BadgeDollarSign className="w-4 h-4" />
              </div>
              <DialogTitle className="text-xl font-bold text-[#0F172A] dark:text-slate-50">
                Record Vehicle Sale
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Select an available vehicle from inventory, assign the buyer, and record the finalized selling price.
            </DialogDescription>
          </DialogHeader>

          {/* Error Alert */}
          {errorMessage && (
            <div className="my-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="my-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-lg flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="font-medium">{successMessage}</div>
            </div>
          )}

          <div className="space-y-4 py-3">
            {/* 1. Vehicle Selection Dropdown */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="vehicle_select" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Available Vehicle <span className="text-red-500">*</span>
                </Label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {availableVehicles.length} available in stock
                </span>
              </div>

              {availableVehicles.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>No vehicles currently available for sale. Please register vehicles first.</span>
                </div>
              ) : (
                <Select
                  id="vehicle_select"
                  value={selectedVehicleId}
                  disabled={loading}
                  onChange={(e) => {
                    setSelectedVehicleId(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="text-xs font-medium"
                >
                  <option value="">-- Choose an available vehicle --</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicle_name} ({v.registration_number})
                    </option>
                  ))}
                </Select>
              )}
            </div>

            {/* Automatically Displayed Vehicle Details */}
            {selectedVehicle ? (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-[#E2E8F0] dark:border-slate-800 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400" />
                    <span className="font-semibold text-xs text-[#0F172A] dark:text-slate-50">
                      {selectedVehicle.vehicle_name}
                    </span>
                  </div>
                  <Badge variant="available" className="text-[10px] px-2 py-0.5">
                    Available
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Registration Number */}
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                      Registration Number
                    </span>
                    <span className="font-mono text-xs px-2.5 py-1 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-800 inline-block">
                      {selectedVehicle.registration_number}
                    </span>
                  </div>

                  {/* Previous Owner's Name */}
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                      Previous Owner
                    </span>
                    <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 mt-1">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{selectedVehicle.owner_name}</span>
                    </div>
                  </div>

                  {/* Purchase Price */}
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                      Purchase Price (Cost)
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-50 text-sm block mt-0.5">
                      {formatCurrency(selectedVehicle.purchase_price)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center text-xs text-slate-400">
                Select a vehicle above to preview its registration, acquisition cost, and previous owner details.
              </div>
            )}

            {/* Buyer Name & Selling Price Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Buyer Name */}
              <div className="space-y-1.5">
                <Label htmlFor="buyer_name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Buyer Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="buyer_name"
                  type="text"
                  required
                  disabled={loading}
                  placeholder="e.g., Rajesh Sharma"
                  value={buyerName}
                  onChange={(e) => {
                    setBuyerName(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="text-xs h-9"
                />
              </div>

              {/* Selling Price */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="selling_price" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Selling Price (₹) <span className="text-red-500">*</span>
                  </Label>
                  {formattedSellingPreview && (
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      {formattedSellingPreview}
                    </span>
                  )}
                </div>
                <Input
                  id="selling_price"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="any"
                  required
                  disabled={loading}
                  placeholder="e.g., 4200000"
                  value={sellingPrice}
                  onChange={(e) => {
                    setSellingPrice(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="text-xs h-9"
                />
              </div>
            </div>

            {/* Real-time Estimated Profit Display */}
            {profitStats && (
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between animate-in fade-in transition-all ${
                  profitStats.isPositive
                    ? "bg-emerald-50/80 border-emerald-200 dark:border-emerald-800/60 text-emerald-900"
                    : profitStats.isBreakEven
                    ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                    : "bg-red-50/80 border-red-200 text-red-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      profitStats.isPositive
                        ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400"
                        : profitStats.isBreakEven
                        ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {profitStats.isPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : profitStats.isBreakEven ? (
                      <Tag className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider block opacity-75">
                      Estimated Realized Profit
                    </span>
                    <span className="font-bold text-sm">
                      {profitStats.isPositive ? "+" : ""}
                      {formatCurrency(profitStats.profit)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
                      profitStats.isPositive
                        ? "bg-emerald-200/80 text-emerald-800"
                        : profitStats.isBreakEven
                        ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        : "bg-red-200/80 text-red-800"
                    }`}
                  >
                    {profitStats.isPositive ? "+" : ""}
                    {profitStats.marginPercent}% margin
                  </span>
                  <span className="text-[10px] block opacity-70 mt-0.5">
                    Selling - Purchase
                  </span>
                </div>
              </div>
            )}

            {/* Sale Date */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="sale_date" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Sale Date
                </Label>
                <span className="text-[11px] text-slate-400">Defaults to today</span>
              </div>
              <div className="relative">
                <Input
                  id="sale_date"
                  type="date"
                  disabled={loading}
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => handleOpenChange(false)}
              className="text-xs h-9 rounded-xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 active:scale-[0.98]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || availableVehicles.length === 0}
              className="text-xs h-9 rounded-xl bg-[#0F172A] dark:bg-blue-600 hover:bg-[#1E293B] dark:hover:bg-blue-500 text-white gap-2 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Recording Sale...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm & Record Sale</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
