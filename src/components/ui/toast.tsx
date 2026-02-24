import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[12050] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative z-[12051] flex w-full items-center justify-between space-x-4 overflow-hidden rounded-2xl border p-6 pr-8 backdrop-blur-xl transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default:
          "default border-emerald-400/25 bg-[rgba(20,24,22,0.9)] text-emerald-50 ring-1 ring-emerald-400/20 shadow-[0_0_0_1px_rgba(16,185,129,.14),0_18px_45px_-18px_rgba(16,185,129,.5)]",
        destructive:
          "destructive border-red-400/40 bg-[rgba(42,16,16,0.94)] text-red-100 ring-1 ring-red-400/20 shadow-[0_0_0_1px_rgba(239,68,68,.16),0_18px_45px_-18px_rgba(239,68,68,.55)]",
        success:
          "success border-emerald-400/35 bg-[rgba(20,24,22,0.9)] text-emerald-100 ring-1 ring-emerald-400/25 shadow-[0_0_0_1px_rgba(16,185,129,.16),0_18px_45px_-18px_rgba(16,185,129,.55)]",
        warning:
          "warning border-amber-400/40 bg-[rgba(45,33,14,0.94)] text-amber-100 ring-1 ring-amber-400/20 shadow-[0_0_0_1px_rgba(245,158,11,.16),0_18px_45px_-18px_rgba(245,158,11,.5)]",
        info:
          "info border-cyan-400/40 bg-[rgba(14,33,45,0.94)] text-cyan-100 ring-1 ring-cyan-400/20 shadow-[0_0_0_1px_rgba(6,182,212,.16),0_18px_45px_-18px_rgba(6,182,212,.5)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return <ToastPrimitives.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />;
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.default]:border-emerald-300/30 group-[.default]:hover:bg-emerald-500/15 group-[.default]:focus:ring-emerald-400 group-[.destructive]:border-red-300/30 group-[.destructive]:hover:bg-red-500/20 group-[.destructive]:focus:ring-red-400 group-[.success]:border-emerald-300/30 group-[.success]:hover:bg-emerald-500/20 group-[.success]:focus:ring-emerald-400 group-[.warning]:border-amber-300/30 group-[.warning]:hover:bg-amber-500/20 group-[.warning]:focus:ring-amber-400 group-[.info]:border-cyan-300/30 group-[.info]:hover:bg-cyan-500/20 group-[.info]:focus:ring-cyan-400",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    aria-label="Закрити повідомлення"
    data-toast-close="true"
    className={cn(
      "absolute right-2 top-2 z-[12052] pointer-events-auto rounded-md p-1 opacity-100 transition-colors hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-[.default]:text-emerald-200 group-[.default]:hover:text-emerald-50 group-[.default]:focus:ring-emerald-400 group-[.destructive]:text-red-200 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.success]:text-emerald-200 group-[.success]:hover:text-emerald-50 group-[.success]:focus:ring-emerald-400 group-[.warning]:text-amber-200 group-[.warning]:hover:text-amber-50 group-[.warning]:focus:ring-amber-400 group-[.info]:text-cyan-200 group-[.info]:hover:text-cyan-50 group-[.info]:focus:ring-cyan-400",
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title ref={ref} className={cn("text-sm font-semibold", className)} {...props} />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
