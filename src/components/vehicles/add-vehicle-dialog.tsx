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
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Plus, Loader2, AlertCircle, CheckCircle2, Car, Shield } from "lucide-react";

interface AddVehicleDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onVehicleAdded?: (vehicle: any) => void;
}

export function AddVehicleDialog({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  onVehicleAdded,
}: AddVehicleDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen || setInternalOpen;

  const [vehicleName, setVehicleName] = React.useState("");
  const [registrationNumber, setRegistrationNumber] = React.useState("");
  const [ownerName, setOwnerName] = React.useState("");
  const [purchasePrice, setPurchasePrice] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const resetForm = () => {
    setVehicleName("");
    setRegistrationNumber("");
    setOwnerName("");
    setPurchasePrice("");
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  // Auto-uppercase registration input
  const handleRegChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setRegistrationNumber(val);
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = vehicleName.trim();
    const cleanReg = registrationNumber.trim().toUpperCase();
    const trimmedOwner = ownerName.trim();
    const priceNum = parseFloat(purchasePrice);

    // Client-side validations
    if (!trimmedName) {
      setErrorMessage("Vehicle name is required.");
      return;
    }

    if (!cleanReg) {
      setErrorMessage("Registration number is required (e.g., DL 01 AB 1234).");
      return;
    }

    if (!trimmedOwner) {
      setErrorMessage("Previous owner's name is required.");
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMessage("Purchase price must be a valid positive number.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_name: trimmedName,
          registration_number: cleanReg,
          owner_name: trimmedOwner,
          purchase_price: priceNum,
          status: "Available",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(
          data.error || `Failed to add vehicle (${res.status} error)`
        );
        return;
      }

      setSuccessMessage("Vehicle successfully registered into inventory!");
      if (onVehicleAdded) {
        onVehicleAdded(data);
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

  const parsedPrice = parseFloat(purchasePrice);
  const formattedPreview =
    !isNaN(parsedPrice) && parsedPrice > 0 ? formatCurrency(parsedPrice) : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className="gap-2 bg-[#0F172A] hover:bg-[#1E293B] shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <Car className="w-4 h-4" />
              </div>
              <DialogTitle className="text-xl font-bold text-[#0F172A]">
                Add New Vehicle
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Register an acquired vehicle into inventory. Duplicate registration numbers are strictly prevented.
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
            <div className="my-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="font-medium">{successMessage}</div>
            </div>
          )}

          <div className="space-y-4 py-3">
            {/* Vehicle Name */}
            <div className="space-y-1.5">
              <Label htmlFor="vehicle_name" className="text-xs font-semibold text-slate-700">
                Vehicle Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="vehicle_name"
                type="text"
                required
                disabled={loading}
                placeholder="e.g., 2022 BMW 3 Series 330i M Sport"
                value={vehicleName}
                onChange={(e) => {
                  setVehicleName(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="text-xs h-9"
              />
            </div>

            {/* Registration Number */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="registration_number" className="text-xs font-semibold text-slate-700">
                  Registration Number <span className="text-red-500">*</span>
                </Label>
                <span className="text-[11px] text-slate-400">e.g., DL 01 AB 1234</span>
              </div>
              <Input
                id="registration_number"
                type="text"
                required
                disabled={loading}
                placeholder="DL 01 AB 1234"
                value={registrationNumber}
                onChange={handleRegChange}
                className="font-mono text-xs uppercase tracking-wide h-9 bg-slate-50/50"
              />
              <p className="text-[11px] text-slate-500">
                Auto-uppercased & trimmed. Must be unique across all inventory records.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Previous Owner's Name */}
              <div className="space-y-1.5">
                <Label htmlFor="owner_name" className="text-xs font-semibold text-slate-700">
                  Previous Owner <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="owner_name"
                  type="text"
                  required
                  disabled={loading}
                  placeholder="e.g., Vikramaditya Rao"
                  value={ownerName}
                  onChange={(e) => {
                    setOwnerName(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="text-xs h-9"
                />
              </div>

              {/* Purchase Price */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="purchase_price" className="text-xs font-semibold text-slate-700">
                    Purchase Price (₹) <span className="text-red-500">*</span>
                  </Label>
                  {formattedPreview && (
                    <span className="text-[11px] font-semibold text-emerald-700">
                      {formattedPreview}
                    </span>
                  )}
                </div>
                <Input
                  id="purchase_price"
                  type="number"
                  min="1"
                  step="any"
                  required
                  disabled={loading}
                  placeholder="e.g., 3850000"
                  value={purchasePrice}
                  onChange={(e) => {
                    setPurchasePrice(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="text-xs h-9"
                />
              </div>
            </div>

            {/* Status Indicator */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Shield className="w-3.5 h-3.5 text-[#1E3A8A]" />
                <span className="font-medium">Initial Fleet Status</span>
              </div>
              <Badge variant="available" className="text-[11px] px-2 py-0.5">
                Available (Auto-assigned)
              </Badge>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => handleOpenChange(false)}
              className="text-xs h-9 rounded-xl border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 active:scale-[0.98]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="text-xs h-9 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white gap-2 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Vehicle</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
