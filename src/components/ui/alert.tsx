import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full overflow-hidden rounded-2xl border p-4 backdrop-blur-xl shadow-[0_16px_40px_-26px_rgba(16,185,129,.45)] transition-colors [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-2px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  {
    variants: {
      variant: {
        default:
          "default border-emerald-400/25 bg-[rgba(20,24,22,0.86)] text-emerald-50 ring-1 ring-emerald-400/15 [&>svg]:text-emerald-300/90",
        destructive:
          "destructive border-red-400/35 bg-[rgba(42,16,16,0.9)] text-red-100 ring-1 ring-red-400/20 shadow-[0_16px_40px_-26px_rgba(239,68,68,.45)] [&>svg]:text-red-300",
        success:
          "success border-emerald-400/35 bg-[rgba(16,34,26,0.9)] text-emerald-100 ring-1 ring-emerald-400/25 [&>svg]:text-emerald-300",
        warning:
          "warning border-amber-400/35 bg-[rgba(45,33,14,0.9)] text-amber-100 ring-1 ring-amber-400/20 [&>svg]:text-amber-300",
        info:
          "info border-cyan-400/35 bg-[rgba(14,33,45,0.9)] text-cyan-100 ring-1 ring-cyan-400/20 [&>svg]:text-cyan-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm opacity-95 [&_p]:leading-relaxed", className)} {...props} />
  ),
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
