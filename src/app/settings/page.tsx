import { Suspense } from "react";
import { dealershipDb } from "@/lib/db";
import { SettingsForm } from "@/components/settings/settings-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, Database } from "lucide-react";

async function SettingsContent() {
  const settings = await dealershipDb.settings.get();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="pb-4 border-b border-[#E2E8F0]">
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#1E3A8A]" />
          System Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure dealership branding, invoice prefixes, and database connectivity.
        </p>
      </div>

      {/* Database Connection Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#1E3A8A]" />
              <CardTitle className="text-base font-bold text-[#0F172A]">
                Database Architecture Status
              </CardTitle>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Supabase PostgreSQL Active</span>
            </div>
          </div>
          <CardDescription>
            All application data is stored exclusively in Supabase PostgreSQL via Drizzle ORM.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-2 border border-[#E2E8F0]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Database Driver:</span>
              <span className="font-mono text-slate-800 font-semibold">
                Drizzle ORM (postgres.js)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">DDL Migration:</span>
              <span className="font-mono text-slate-800">supabase-schema.sql</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Seed Command:</span>
              <span className="font-mono text-slate-800">npm run db:seed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dealership Info Form */}
      <SettingsForm initialSettings={settings} />
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      <div className="h-8 w-48 bg-slate-200 animate-pulse rounded" />
      <div className="h-32 bg-slate-100 border border-slate-200 rounded-lg animate-pulse" />
      <div className="h-96 bg-slate-100 border border-slate-200 rounded-lg animate-pulse" />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
