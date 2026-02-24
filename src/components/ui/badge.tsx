import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-emerald-400/25 bg-[rgba(16,34,26,0.85)] text-emerald-200 ring-1 ring-emerald-400/15 shadow-[0_2px_12px_-4px_rgba(16,185,129,.35)] focus:ring-emerald-400",
        secondary:
          "border-slate-400/25 bg-[rgba(30,30,40,0.85)] text-slate-200 ring-1 ring-slate-400/15 shadow-[0_2px_12px_-4px_rgba(148,163,184,.2)] focus:ring-slate-400",
        destructive:
          "border-red-400/35 bg-[rgba(42,16,16,0.85)] text-red-200 ring-1 ring-red-400/20 shadow-[0_2px_12px_-4px_rgba(239,68,68,.4)] focus:ring-red-400",
        success:
          "border-emerald-400/35 bg-[rgba(16,34,26,0.9)] text-emerald-200 ring-1 ring-emerald-400/25 shadow-[0_2px_12px_-4px_rgba(16,185,129,.45)] focus:ring-emerald-400",
        warning:
          "border-amber-400/35 bg-[rgba(45,33,14,0.85)] text-amber-200 ring-1 ring-amber-400/20 shadow-[0_2px_12px_-4px_rgba(245,158,11,.4)] focus:ring-amber-400",
        info:
          "border-cyan-400/35 bg-[rgba(14,33,45,0.85)] text-cyan-200 ring-1 ring-cyan-400/20 shadow-[0_2px_12px_-4px_rgba(6,182,212,.4)] focus:ring-cyan-400",
        outline:
          "border-white/20 bg-transparent text-foreground ring-1 ring-white/10 backdrop-blur-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
