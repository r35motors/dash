export const dynamic = "force-dynamic";

import { dealershipDb } from "@/lib/db";
import { SettingsForm } from "@/components/settings/settings-form";
import { Card } from "@/components/ui/card";
import { Settings, Database } from "lucide-react";

export default async function SettingsPage() {
  const settings = await dealershipDb.settings.get();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <Settings className="w-4 h-4" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] dark:text-slate-50">
            Dealership Settings
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure dealership branding, invoice prefixes, and verify database connectivity.
        </p>
      </div>

      {/* Database Connection Status Card */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-premium">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0F172A] dark:text-slate-50">
                Database Architecture Status
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All application data is stored in Supabase PostgreSQL via Drizzle ORM.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 text-xs font-semibold border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Supabase Active</span>
          </div>
        </div>

        <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Database Driver
            </div>
            <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              Drizzle (postgres.js)
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              DDL Schema
            </div>
            <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              supabase-schema.sql
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Location / Region
            </div>
            <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              ap-south-1 (Mumbai)
            </div>
          </div>
        </div>
      </Card>

      {/* Dealership Info Form */}
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
