import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          className={cn(
            "flex h-9.5 w-full appearance-none rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 pr-9 text-sm text-[#0F172A] shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:border-slate-900 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-rose-500 focus-visible:ring-rose-500/20",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
