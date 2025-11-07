import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "danger" | "ghost";
    loading?: boolean;
    size?: "sm" | "md" | "lg";
}

export default function NeonButton({
    variant = "primary",
    size = "md",
    loading,
    disabled,
    className,
    children,
    ...rest
}: NeonButtonProps) {
    const base = "inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200 select-none ring-1 cursor-target";

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-sm",
        lg: "px-5 py-2.5 text-base",
    }[size];

    const styles = {
        primary: "bg-emerald-600 text-white ring-emerald-400/40 hover:bg-emerald-500 hover:shadow-[0_0_32px_-8px_rgba(16,185,129,.7)] active:translate-y-[1px]",
        danger: "bg-red-600 text-white ring-red-400/40 hover:bg-red-500 hover:shadow-[0_0_28px_-10px_rgba(239,68,68,.7)] active:translate-y-[1px]",
        ghost: "bg-neutral-900/70 text-neutral-200 ring-emerald-400/20 hover:ring-emerald-400/40 hover:bg-neutral-900 active:translate-y-[1px]",
    }[variant];

    const off = (disabled || loading) && "opacity-60 pointer-events-none";

    return (
        <button
            {...rest}
            disabled={disabled || loading}
            className={cn(base, sizes, styles, off, className)}
        >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
}













