"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Check,
  CheckCircle2,
  Loader2,
  Save,
  Upload,
  Image as ImageIcon,
  Building2,
  Phone,
  Hash,
  MapPin,
  X,
} from "lucide-react";

interface SettingsFormProps {
  initialSettings: {
    id?: string;
    business_name: string;
    logo_path?: string | null;
    address: string;
    contact_number_1: string;
    contact_number_2?: string | null;
    invoice_prefix: string;
  };
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [formData, setFormData] = React.useState({
    business_name: initialSettings?.business_name || "",
    logo_path: initialSettings?.logo_path || "",
    address: initialSettings?.address || "",
    contact_number_1: initialSettings?.contact_number_1 || "",
    contact_number_2: initialSettings?.contact_number_2 || "",
    invoice_prefix: initialSettings?.invoice_prefix || "INV",
  });

  const [saving, setSaving] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [currentYear, setCurrentYear] = React.useState<number>(2026);

  React.useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Handle image file upload (auto-downscale via canvas to max 300px to ensure ultra-fast loading)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (PNG, JPG, SVG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Image size exceeds 10MB limit. Please choose a smaller image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 300;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/png");
          setFormData((prev) => ({ ...prev, logo_path: compressedDataUrl }));
        } else {
          setFormData((prev) => ({ ...prev, logo_path: dataUrl }));
        }
        setErrorMessage(null);
      };
      img.onerror = () => {
        setFormData((prev) => ({ ...prev, logo_path: dataUrl }));
        setErrorMessage(null);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handlePresetLogo = (presetPath: string) => {
    setFormData((prev) => ({ ...prev, logo_path: presetPath }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    // Validation
    if (!formData.business_name.trim()) {
      setErrorMessage("Dealership business name is required.");
      setSaving(false);
      return;
    }
    if (!formData.address.trim()) {
      setErrorMessage("Dealership address is required.");
      setSaving(false);
      return;
    }
    if (!formData.contact_number_1.trim()) {
      setErrorMessage("First contact number is required.");
      setSaving(false);
      return;
    }
    if (!formData.invoice_prefix.trim()) {
      setErrorMessage("Invoice prefix is required.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: formData.business_name.trim(),
          logo_path: formData.logo_path.trim() || null,
          address: formData.address.trim(),
          contact_number_1: formData.contact_number_1.trim(),
          contact_number_2: formData.contact_number_2?.trim() || null,
          invoice_prefix: formData.invoice_prefix.trim().toUpperCase(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update business settings");
      }

      const updated = await res.json();
      setFormData({
        business_name: updated.business_name || formData.business_name,
        logo_path: updated.logo_path || "",
        address: updated.address || formData.address,
        contact_number_1: updated.contact_number_1 || formData.contact_number_1,
        contact_number_2: updated.contact_number_2 || "",
        invoice_prefix: updated.invoice_prefix || formData.invoice_prefix,
      });

      setSuccessMessage(
        "Dealership profile saved successfully! New invoices will automatically use these settings."
      );

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      setErrorMessage(err.message || "An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Notification Alert Banner */}
      {successMessage && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Settings Saved Successfully</p>
              <p className="text-xs text-emerald-700 mt-0.5">{successMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Notification Alert Banner */}
      {errorMessage && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <X className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dealership Profile Form with Only Exact Fields */}
      <Card className="border-[#E2E8F0] shadow-xs">
        <CardHeader className="border-b border-[#E2E8F0] pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#1E3A8A]" />
            <CardTitle className="text-base font-bold text-[#0F172A]">
              Dealership Profile & Invoice Configuration
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Section 8 Dealership Profile: These exact 6 fields brand and identify your business on all generated tax invoices, bill of sales, and headers.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-5">
          {/* Exact Field 1: Dealership name (business_name) */}
          <div className="space-y-1.5">
            <Label htmlFor="business_name" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Dealership Name</span>
              <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="business_name"
              value={formData.business_name}
              onChange={(e) =>
                setFormData({ ...formData, business_name: e.target.value })
              }
              placeholder="e.g. R35 MOTORS"
              required
              className="text-sm"
            />
          </div>

          {/* Exact Field 2: Dealership logo (logo_path - support URL or image upload/preset) */}
          <div className="space-y-2 p-4 bg-slate-50/70 border border-[#E2E8F0] rounded-lg">
            <div className="flex items-center justify-between">
              <Label htmlFor="logo_path" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Dealership Logo</span>
                <span className="text-slate-400 font-normal">(URL, preset, or image upload)</span>
              </Label>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Live Logo Preview Box */}
              <div className="w-20 h-20 rounded-lg border border-slate-200 bg-white flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-2xs">
                {formData.logo_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formData.logo_path}
                    alt="Dealership Logo Preview"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1 stroke-1" />
                    <span className="text-[9px] uppercase font-bold tracking-wider">No Logo</span>
                  </div>
                )}
              </div>

              {/* Logo URL Input & Actions */}
              <div className="flex-1 space-y-2 w-full">
                <Input
                  id="logo_path"
                  value={formData.logo_path}
                  onChange={(e) =>
                    setFormData({ ...formData, logo_path: e.target.value })
                  }
                  placeholder="https://... or /dealership-logo.svg or upload an image"
                  className="text-xs bg-white"
                />

                <div className="flex flex-wrap items-center gap-2">
                  {/* File Upload Button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs h-7 gap-1 border-slate-300 bg-white hover:bg-slate-50"
                  >
                    <Upload className="w-3 h-3 text-[#1E3A8A]" />
                    <span>Upload Image</span>
                  </Button>

                  {/* Preset Buttons */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetLogo("/dealership-logo.svg")}
                    className="text-xs h-7 border-slate-300 bg-white hover:bg-slate-50"
                  >
                    Preset: SVG Crest
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetLogo("/logo.png")}
                    className="text-xs h-7 border-slate-300 bg-white hover:bg-slate-50"
                  >
                    Preset: PNG Shield
                  </Button>

                  {formData.logo_path && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData((prev) => ({ ...prev, logo_path: "" }))}
                      className="text-xs h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Exact Field 3: Address (address) */}
          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Dealership Address</span>
              <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="e.g. Plot 42, Highline Auto Corridor, MG Road, Bangalore 560001"
              required
              className="text-sm"
            />
          </div>

          {/* Exact Fields 4 & 5: First Contact Number & Second Contact Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact_number_1" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>First Contact Number</span>
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="contact_number_1"
                value={formData.contact_number_1}
                onChange={(e) =>
                  setFormData({ ...formData, contact_number_1: e.target.value })
                }
                placeholder="+91 98765 43210"
                required
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact_number_2" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Second Contact Number</span>
                <span className="text-slate-400 font-normal">(Optional)</span>
              </Label>
              <Input
                id="contact_number_2"
                value={formData.contact_number_2}
                onChange={(e) =>
                  setFormData({ ...formData, contact_number_2: e.target.value })
                }
                placeholder="+91 98765 43211"
                className="text-sm"
              />
            </div>
          </div>

          {/* Exact Field 6: Invoice prefix (invoice_prefix) */}
          <div className="space-y-1.5 max-w-sm">
            <Label htmlFor="invoice_prefix" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span>Invoice Prefix</span>
              <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="invoice_prefix"
              value={formData.invoice_prefix}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  invoice_prefix: e.target.value.toUpperCase(),
                })
              }
              placeholder="e.g. R35 or INV"
              required
              className="font-mono uppercase text-sm"
            />
            <p className="text-[11px] text-slate-500">
              Generated invoices will format as: <span className="font-mono font-semibold text-slate-700">{formData.invoice_prefix || "INV"}-{currentYear}-0001</span>
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center border-t border-[#E2E8F0] pt-4">
          <span className="text-xs text-slate-400">
            Changes persist to database and propagate to invoices instantly.
          </span>

          <Button
            type="submit"
            disabled={saving}
            className="bg-[#0F172A] hover:bg-[#1E293B] text-white gap-2 shadow-xs"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Settings</span>
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
