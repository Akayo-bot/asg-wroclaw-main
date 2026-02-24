import React from 'react';
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Info, TriangleAlert, XCircle } from "lucide-react";

type AlertVariant = "default" | "destructive" | "success" | "warning" | "info";

interface GlassAlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: AlertVariant;
    title?: string;
    description?: React.ReactNode;
    icon?: React.ReactNode;
}

const variantStyles: Record<AlertVariant, string> = {
    default: "border-emerald-400/25 bg-[rgba(20,24,22,0.86)] text-emerald-50 ring-1 ring-emerald-400/15 shadow-[0_0_0_1px_rgba(16,185,129,.14),0_18px_45px_-18px_rgba(16,185,129,.5)]",
    destructive: "border-red-400/40 bg-[rgba(42,16,16,0.94)] text-red-100 ring-1 ring-red-400/20 shadow-[0_0_0_1px_rgba(239,68,68,.16),0_18px_45px_-18px_rgba(239,68,68,.55)]",
    success: "border-emerald-400/35 bg-[rgba(20,24,22,0.9)] text-emerald-100 ring-1 ring-emerald-400/25 shadow-[0_0_0_1px_rgba(16,185,129,.16),0_18px_45px_-18px_rgba(16,185,129,.55)]",
    warning: "border-amber-400/40 bg-[rgba(45,33,14,0.94)] text-amber-100 ring-1 ring-amber-400/20 shadow-[0_0_0_1px_rgba(245,158,11,.16),0_18px_45px_-18px_rgba(245,158,11,.5)]",
    info: "border-cyan-400/40 bg-[rgba(14,33,45,0.94)] text-cyan-100 ring-1 ring-cyan-400/20 shadow-[0_0_0_1px_rgba(6,182,212,.16),0_18px_45px_-18px_rgba(6,182,212,.5)]",
};

const variantIcons: Record<AlertVariant, React.FC<{ className?: string }>> = {
    default: Info,
    destructive: XCircle,
    success: CheckCircle,
    warning: TriangleAlert,
    info: Info, // Changed from InfoIcon to Info to match lucide export
};

const variantIconColors: Record<AlertVariant, string> = {
    default: "text-emerald-300/90",
    destructive: "text-red-300",
    success: "text-emerald-300",
    warning: "text-amber-300",
    info: "text-cyan-300",
};

export function GlassAlert({
    className,
    variant = "default",
    title,
    description,
    icon,
    children,
    ...props
}: GlassAlertProps) {
    const IconComponent = variantIcons[variant];
    const iconColor = variantIconColors[variant];

    return (
        <div
            role="alert"
            className={cn(
                "relative w-full rounded-2xl border backdrop-blur-xl px-4 py-3 flex gap-3 items-start transition-all duration-300",
                variantStyles[variant],
                className
            )}
            {...props}
        >
            <div className="shrink-0 mt-0.5">
                {icon ? icon : <IconComponent className={cn("h-5 w-5", iconColor)} />}
            </div>
            <div className="flex-1 space-y-1">
                {title && (
                    <h5 className="font-semibold leading-none tracking-tight font-sans">
                        {title}
                    </h5>
                )}
                <div className="text-sm opacity-90 font-sans leading-relaxed">
                    {description || children}
                </div>
            </div>
        </div>
    );
}
