import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Check } from "lucide-react";

export type NeonOption = { id: string; label: string; textColor?: string; hoverColor?: string };

export function NeonPopoverList({
    value,
    onChange,
    options,
    minW = 220,
    width = 200,
    color = "emerald",
}: {
    value: string;
    onChange: (v: string) => void;
    options: NeonOption[];
    minW?: number;
    width?: number;
    color?: "emerald" | "cyan" | "red" | "violet";
}) {
    const [open, setOpen] = React.useState(false);
    const selected = options.find((o) => o.id === value) ?? options[0];

    // цвета неона
    const neon = {
        emerald: "text-emerald-300 ring-emerald-400/30 hover:ring-emerald-400/50 focus:ring-emerald-400/60 shadow-[0_0_8px_rgba(52,211,153,0.3)]",
        cyan: "text-cyan-300 ring-cyan-400/30 hover:ring-cyan-400/50 focus:ring-cyan-400/60 shadow-[0_0_8px_rgba(34,211,238,0.3)]",
        red: "text-red-300 ring-red-400/30 hover:ring-red-400/50 focus:ring-red-400/60 shadow-[0_0_8px_rgba(248,113,113,0.3)]",
        violet: "text-violet-300 ring-violet-400/30 hover:ring-violet-400/50 focus:ring-violet-400/60 shadow-[0_0_8px_rgba(167,139,250,0.3)]",
    }[color];

    // функция для получения hover-классов
    const getHoverClasses = (hoverColor: string, isAll?: boolean) => {
        // для "Усі категорії" и "Усі статуси" используем нейтральный hover без яркого свечения
        if (isAll) {
            return "hover:bg-neutral-800/50 hover:text-neutral-200";
        }
        const hoverMap: Record<string, string> = {
            violet: "hover:bg-violet-400/15 hover:text-violet-200 hover:shadow-[0_0_12px_rgba(167,139,250,0.3)]",
            sky: "hover:bg-sky-400/15 hover:text-sky-200 hover:shadow-[0_0_12px_rgba(56,189,248,0.3)]",
            rose: "hover:bg-rose-400/15 hover:text-rose-200 hover:shadow-[0_0_12px_rgba(251,113,133,0.3)]",
            emerald: "hover:bg-emerald-400/15 hover:text-emerald-200 hover:shadow-[0_0_12px_rgba(52,211,153,0.3)]",
            amber: "hover:bg-amber-400/15 hover:text-amber-200 hover:shadow-[0_0_12px_rgba(251,191,36,0.3)]",
        };
        return hoverMap[hoverColor] || hoverMap.emerald;
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={`w-full lg:w-auto inline-flex items-center justify-between rounded-lg
                               bg-neutral-950/70 px-3 py-2.5 text-sm ring-1
                               ring-emerald-400/30 transition-all duration-200
                               hover:bg-neutral-900/80 hover:ring-emerald-400/50 focus:outline-none focus:ring-emerald-400/60
                               ${neon}`}
                    style={{ 
                        minWidth: minW || undefined, 
                        maxWidth: minW === 0 ? '100%' : undefined,
                        width: width && typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${width}px` : undefined
                    }}
                >
                    <span className={`truncate flex-1 min-w-0 ${selected?.textColor || "text-neutral-300"}`}>{selected?.label}</span>
                    <ChevronDown className={`ml-2 h-4 w-4 text-neutral-400 flex-shrink-0`} />
                </button>
            </PopoverTrigger>

            <PopoverContent
                align="start"
                side="bottom"
                className="z-[70] rounded-xl border border-emerald-500/30
                           bg-neutral-950/95 backdrop-blur-sm p-2 shadow-[0_0_15px_rgba(52,211,153,0.1)]
                           w-auto max-w-[calc(100vw-2.5rem)] sm:max-w-[calc(100vw-3.5rem)] lg:max-w-none"
                style={{ width: width && typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${width}px` : undefined }}
            >
                <ul className="max-h-72 overflow-y-auto overflow-x-hidden py-1">
                    {options.map((o) => {
                        const active = value === o.id;
                        return (
                            <li key={o.id}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange(o.id);
                                        setOpen(false);
                                    }}
                                    className={`flex items-center justify-between rounded-md py-2
                                              text-left text-sm transition-all duration-150
                                              ${active
                                            ? "bg-emerald-500/20 ring-1 ring-emerald-400/60 shadow-[0_0_12px_rgba(52,211,153,0.25)] mx-1 px-2.5 w-[calc(100%-8px)]"
                                            : getHoverClasses(o.hoverColor || "emerald", o.id === "all") + " mx-1 px-2.5 w-[calc(100%-8px)]"
                                        }`}
                                >
                                    <span className={`truncate ${active ? "text-white" : (o.textColor || "text-neutral-300")}`}>
                                        {o.label}
                                    </span>
                                    {active && (
                                        <Check className="ml-2 h-4 w-4 text-emerald-400" />
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </PopoverContent>
        </Popover>
    );
}

