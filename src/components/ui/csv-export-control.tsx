"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { getTodayDateString } from "@/lib/csv";

interface CsvExportControlProps {
  onExport: (tillDate: string) => void;
  label?: string;
}

export function CsvExportControl({
  onExport,
  label = "Export CSV",
}: CsvExportControlProps) {
  const [tillDate, setTillDate] = React.useState<string>("");

  React.useEffect(() => {
    setTillDate(getTodayDateString());
  }, []);

  const handleExportClick = () => {
    onExport(tillDate || getTodayDateString());
  };

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 min-h-[44px] sm:min-h-0 sm:h-9.5 shadow-xs flex-1 sm:flex-initial min-w-0">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
          Till:
        </span>
        <input
          type="date"
          aria-label="Export data till date"
          value={tillDate}
          onChange={(e) => setTillDate(e.target.value)}
          className="bg-transparent text-xs font-medium text-[#0F172A] dark:text-slate-100 focus:outline-none cursor-pointer w-full min-w-0 sm:w-auto"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleExportClick}
        className="gap-1.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs font-semibold cursor-pointer rounded-xl min-h-[44px] sm:min-h-0 sm:h-9.5 px-3.5 text-xs active:scale-95 shrink-0"
      >
        <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span>{label}</span>
      </Button>
    </div>
  );
}
