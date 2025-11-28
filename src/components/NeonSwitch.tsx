import clsx from "clsx";
import { useId } from "react";

type Props = {
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
    size?: "sm" | "md" | "lg";
    label?: string;
    labelHidden?: boolean;
};

export default function NeonSwitch({
    checked,
    onChange,
    disabled = false,
    size = "md",
    label,
    labelHidden,
}: Props) {
    const id = useId();

    const dims = (
        {
            sm: { w: 36, h: 20, dot: 16, pad: 2 },
            md: { w: 44, h: 24, dot: 20, pad: 2 },
            lg: { w: 56, h: 32, dot: 28, pad: 2 },
        } as const
    )[size];

    const translateX = checked ? dims.w - dims.dot - dims.pad * 2 : 0;

    return (
        <label
            htmlFor={id}
            className={clsx(
                "group inline-flex items-center gap-2 select-none",
                disabled && "opacity-60 cursor-not-allowed"
            )}
        >
            <span
                className={clsx(
                    "relative rounded-full ring-1 transition-all",
                    "bg-neutral-900/70 ring-emerald-400/20",
                    checked &&
                    "bg-emerald-500/25 ring-emerald-400/40 shadow-[0_0_30px_-10px_rgba(16,185,129,.6)]"
                )}
                style={{ width: dims.w, height: dims.h }}
            >
                <input
                    id={id}
                    type="checkbox"
                    role="switch"
                    aria-checked={checked}
                    disabled={disabled}
                    className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    onChange={() => onChange(!checked)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onChange(!checked);
                        }
                    }}
                />

                <span
                    className="
            pointer-events-none absolute inset-0 rounded-full
            peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-400/50
            peer-focus-visible:shadow-[0_0_0_6px_rgba(16,185,129,.08)]
          "
                />

                <span
                    className={clsx(
                        "absolute top-[2px] rounded-full bg-white transition-transform duration-200",
                        checked && "shadow-[0_0_16px_rgba(16,185,129,.75)]"
                    )}
                    style={{
                        width: dims.dot,
                        height: dims.dot,
                        transform: `translateX(${translateX}px)`,
                        left: dims.pad,
                    }}
                />

                <span
                    className={clsx(
                        "pointer-events-none absolute inset-y-0 rounded-full",
                        "bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent",
                        checked ? "opacity-100" : "opacity-0",
                        "transition-opacity duration-200"
                    )}
                    style={{ left: 4, right: 4 }}
                />
            </span>

            {label && (
                <span className={clsx("text-sm text-neutral-300", labelHidden && "sr-only")}>
                    {label}
                </span>
            )}
        </label>
    );
}




















