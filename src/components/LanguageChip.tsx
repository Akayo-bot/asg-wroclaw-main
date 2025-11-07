import { useEffect, useRef, useState } from "react";
import { Globe2, Check } from "lucide-react";
import clsx from "clsx";

type Lang = "uk" | "ru" | "en" | "pl";
const LABEL: Record<Lang, string> = { uk: "UA", ru: "RU", en: "EN", pl: "PL" };
const NAME: Record<Lang, string> = { uk: "Українська", ru: "Русский", en: "English", pl: "Polski" };

export default function LanguageChip({
    value,
    onChange,
    size = "md",
    className,
}: {
    value: Lang;
    onChange: (v: Lang) => void;
    size?: "sm" | "md";
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const handleToggle = () => setOpen((v) => !v);
    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
        }
        if (e.key === "Escape") setOpen(false);
    };

    return (
        <div ref={ref} className={clsx("relative inline-block", className)}>
            <button
                type="button"
                tabIndex={0}
                aria-label="Language selector"
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                className={clsx(
                    "inline-flex items-center gap-2 rounded-xl ring-1 transition-all cursor-target",
                    "bg-neutral-900/70 text-neutral-100 ring-emerald-400/20 hover:ring-emerald-400/40",
                    size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm",
                    open && "shadow-[0_0_22px_-8px_rgba(16,185,129,.6)]"
                )}
            >
                <Globe2 className={clsx(size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4", "text-emerald-300")} />
                <span className="tracking-wide">{LABEL[value]}</span>
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute z-50 mt-2 max-w-[90vw] min-w-[11rem] sm:w-56 overflow-hidden rounded-xl bg-[#141816]/95 p-1 ring-1 ring-emerald-400/25 backdrop-blur left-0 sm:left-auto sm:right-0"
                >
                    {(Object.keys(LABEL) as Lang[]).map((code) => (
                        <button
                            key={code}
                            type="button"
                            tabIndex={0}
                            aria-label={`Switch language to ${NAME[code]}`}
                            onClick={() => { onChange(code); setOpen(false); }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onChange(code);
                                    setOpen(false);
                                }
                            }}
                            className={clsx(
                                "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-all cursor-target text-left",
                                "text-neutral-200 hover:bg-neutral-900/70 hover:ring-1 hover:ring-emerald-400/25"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <span className="rounded-md bg-neutral-800 px-1.5 py-0.5 text-xs text-emerald-300 ring-1 ring-white/10 shrink-0">
                                    {LABEL[code]}
                                </span>
                                <span className="whitespace-normal break-words leading-snug">
                                    {NAME[code]}
                                </span>
                            </span>
                            {value === code && <Check className="h-4 w-4 text-emerald-400" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}


