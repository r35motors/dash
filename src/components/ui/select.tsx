import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  wrapperClassName?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, children, error, ...props }, ref) => {
    return (
      <div className={cn("relative w-full", wrapperClassName)}>
        <select
          style={{ appearance: "none", WebkitAppearance: "none", MozAppearance: "none" }}
          className={cn(
            "no-native-arrow flex h-9.5 w-full appearance-none bg-none rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 pr-9 text-sm text-[#0F172A] dark:text-slate-100 shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10 dark:focus-visible:ring-sky-400/20 focus-visible:border-slate-900 dark:focus-visible:border-sky-400 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-rose-500 focus-visible:ring-rose-500/20",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
        />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
