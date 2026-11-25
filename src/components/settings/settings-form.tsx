"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
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
  FileText,
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
  const router = useRouter();
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

      // Instantly refresh router state to propagate changes across the UI
      router.refresh();

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
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/20 text-emerald-800 flex items-start justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Settings Saved Successfully</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">{successMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 dark:text-emerald-400 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Notification Alert Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-500/20 text-rose-800 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <X className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Section: Dealership Profile */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-premium overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A] dark:text-slate-50">
                Dealership Profile & Branding
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Information displayed across printed invoices, sales receipts, and system navigation.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Field 1: Dealership name (business_name) */}
          <div className="space-y-1.5">
            <Label htmlFor="business_name" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
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

          {/* Field 2: Dealership logo */}
          <div className="space-y-2 p-4 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between">
              <Label htmlFor="logo_path" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Dealership Logo</span>
                <span className="text-slate-400 font-normal">(URL, preset, or image upload)</span>
              </Label>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pt-1">
              {/* Live Logo Preview Box (Keep white backing so dark logos stay visible) */}
              <div className="w-20 h-20 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-2xs">
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
                    <ImageIcon className="w-5 h-5 mx-auto mb-1 stroke-1 text-slate-400" />
                    <span className="text-[9px] uppercase font-bold tracking-wider">No Logo</span>
                  </div>
                )}
              </div>

              {/* Logo URL Input & Actions */}
              <div className="flex-1 space-y-2 w-full">
                <Input
                  id="logo_path"
                  value={formData.logo_path.startsWith("data:") ? "Uploaded custom logo (PNG stored)" : formData.logo_path}
                  readOnly={formData.logo_path.startsWith("data:")}
                  onChange={(e) =>
                    setFormData({ ...formData, logo_path: e.target.value })
                  }
                  placeholder="https://... or /dealership-logo.svg or upload an image"
                  className="text-xs bg-white dark:bg-slate-900 font-mono"
                />

                <div className="flex flex-wrap items-center gap-2">
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
                    className="text-xs h-7.5 gap-1.5 rounded-xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 active:scale-[0.98]"
                  >
                    <Upload className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                    <span>Upload Image</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetLogo("/dealership-logo.svg")}
                    className="text-xs h-7.5 rounded-xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 active:scale-[0.98]"
                  >
                    Preset: SVG Crest
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetLogo("/logo.png")}
                    className="text-xs h-7.5 rounded-xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 active:scale-[0.98]"
                  >
                    Preset: PNG Shield
                  </Button>

                  {formData.logo_path && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData((prev) => ({ ...prev, logo_path: "" }))}
                      className="text-xs h-7.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Field 3: Address */}
          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
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

          {/* Fields 4 & 5: First Contact & Second Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact_number_1" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Primary Contact Phone</span>
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="contact_number_1"
                type="tel"
                inputMode="tel"
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
              <Label htmlFor="contact_number_2" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Secondary Contact Phone</span>
                <span className="text-slate-400 font-normal">(Optional)</span>
              </Label>
              <Input
                id="contact_number_2"
                type="tel"
                inputMode="tel"
                value={formData.contact_number_2}
                onChange={(e) =>
                  setFormData({ ...formData, contact_number_2: e.target.value })
                }
                placeholder="+91 98765 43211"
                className="text-sm"
              />
            </div>
          </div>

          {/* Field 6: Invoice prefix */}
          <div className="space-y-1.5 max-w-sm">
            <Label htmlFor="invoice_prefix" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span>Invoice Prefix Sequence</span>
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
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Next invoice generated will be formatted as: <span className="font-mono font-semibold text-slate-900 dark:text-slate-50">{formData.invoice_prefix || "INV"}-{currentYear}-0001</span>
            </p>
          </div>
        </div>

        {/* Footer with instant action */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 p-5 bg-slate-50/70 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-800">
          <span className="text-xs text-slate-400 text-center sm:text-left">
            Changes persist directly to Supabase and update invoices across the app.
          </span>

          <Button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-[#0F172A] dark:bg-blue-600 hover:bg-[#1E293B] dark:hover:bg-blue-500 text-white gap-2 shadow-xs cursor-pointer h-9.5 px-5 rounded-xl active:scale-[0.98] transition-all"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Settings</span>
          </Button>
        </div>
      </Card>
    </form>
  );
}
