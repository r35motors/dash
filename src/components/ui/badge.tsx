import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#0F172A] text-white shadow-2xs hover:bg-[#1E293B]",
        secondary:
          "border-slate-200/80 bg-slate-100 text-slate-700 hover:bg-slate-200/80",
        available:
          "border-emerald-500/20 bg-emerald-50 text-emerald-700",
        sold:
          "border-slate-200/80 bg-slate-100 text-slate-600",
        destructive:
          "border-rose-500/20 bg-rose-50 text-rose-700",
        outline:
          "text-slate-700 border-slate-200/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
