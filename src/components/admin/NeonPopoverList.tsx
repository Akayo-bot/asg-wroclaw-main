import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Check } from "lucide-react";

export type NeonOption = { id: string; label: React.ReactNode; textLabel?: string; textColor?: string; hoverColor?: string };

export function NeonPopoverList({
    value,
    onChange,
    options,
    minW = 220,
    width = 200,
    color = "teal",
    disablePortal = false,
    className,
}: {
    value: string;
    onChange: (v: string) => void;
    options: NeonOption[];
    minW?: number;
    width?: number;
    color?: "teal" | "cyan" | "red" | "violet";
    disablePortal?: boolean;
    className?: string;
}) {
    const [open, setOpen] = React.useState(false);
    // Use portal by default to avoid clipping, unless specifically disabled for some reason (rare)
    // Actually, user had issues with jitter with portal, but clipping without.
    // The "cut off" issue implies clipping. Portal fixes clipping.
    // Jitter with portal usually happens if trigger moves (sticky/fixed).
    // Filters in GalleryManager are in normal flow. Jitter might have been scroll lock related.
    // Let's force portal enabled (disablePortal=false) inside the component logic for now to fix clipping,
    // ignoring the prop unless we really need it. Or better, respect prop but default to false.
    // The user passed disablePortal={true} in GalleryManager. I should flip it there or ignore it here.
    // To be safe and fix the clipping, I will ignore the passed disablePortal prop for a moment or change the default.
    // The previous edit hardcoded disablePortal={false} in JSX.
    
    const selected = options.find((o) => o.id === value) ?? options[0];
    const selectedLabel = selected?.textLabel || (typeof selected?.label === 'string' ? selected?.label : '');

    // цвета неона
    const neon = {
        teal: "text-[#46D6C8] ring-[#46D6C8]/30 hover:ring-[#46D6C8]/50 focus:ring-[#46D6C8]/60 shadow-[0_0_8px_rgba(70,214,200,0.3)]",
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
            teal: "hover:bg-[#46D6C8]/15 hover:text-[#46D6C8] hover:shadow-[0_0_12px_rgba(70,214,200,0.3)]",
            emerald: "hover:bg-[#46D6C8]/15 hover:text-[#46D6C8] hover:shadow-[0_0_12px_rgba(70,214,200,0.3)]",
            amber: "hover:bg-amber-400/15 hover:text-amber-200 hover:shadow-[0_0_12px_rgba(251,191,36,0.3)]",
        };
        return hoverMap[hoverColor] || hoverMap.teal;
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={`group w-full lg:w-auto inline-flex items-center justify-start rounded-lg
                               bg-black px-3 h-11 text-sm ring-1
                               ring-[#46D6C8]/30 transition-all duration-200
                               hover:bg-neutral-900/80 hover:ring-[#46D6C8]/50 focus:outline-none focus:ring-[#46D6C8]/60
                               ${neon} ${className || ''}`}
                    style={{
                        minWidth: minW ? `min(${minW}px, 100%)` : undefined,
                        maxWidth: minW === 0 ? '100%' : undefined,
                        width: width && typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${width}px` : undefined
                    }}
                >
                    <div className="flex-1 min-w-0 overflow-hidden text-left">
                        <span className={`${typeof selected?.label === 'string' ? 'truncate block' : ''} ${selected?.textColor || "text-neutral-300"}`} title={selectedLabel as string}>
                            {selected?.label}
                        </span>
                    </div>
                    <ChevronDown className={`ml-2 h-5 w-5 text-neutral-400 flex-shrink-0`} />
                </button>
            </PopoverTrigger>

            <PopoverContent
                align="start"
                side="bottom"
                collisionPadding={16}
                sideOffset={4}
                disablePortal={disablePortal}
                className="z-[10000] rounded-xl border border-[#46D6C8]/30
                           bg-neutral-950/95 backdrop-blur-sm p-2 shadow-[0_0_15px_rgba(70,214,200,0.1)]
                           w-[--radix-popover-trigger-width] max-w-[calc(100vw-2.5rem)] sm:max-w-[calc(100vw-3.5rem)] lg:max-w-none"
            >
                <ul
                    className="max-h-[300px] overflow-y-auto overflow-x-hidden py-1 neon-scrollbar overscroll-contain pointer-events-auto"
                    onWheel={(e) => e.stopPropagation()}
                >
                    {options.map((o) => {
                        const active = value === o.id;
                        const optionLabelText = o.textLabel || (typeof o.label === 'string' ? o.label : '');
                        return (
                            <li key={o.id}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange(o.id);
                                        setOpen(false);
                                    }}
                                    className={`group flex items-center justify-between rounded-md py-2.5
                                              text-left text-sm transition-all duration-150
                                              ${active
                                            ? "bg-[#46D6C8]/20 ring-1 ring-[#46D6C8]/60 shadow-[0_0_12px_rgba(70,214,200,0.25)] mx-1 px-3 w-[calc(100%-8px)]"
                                            : getHoverClasses(o.hoverColor || "teal", o.id === "all") + " mx-1 px-3 w-[calc(100%-8px)]"
                                        }`}
                                >
                                    <span className={`flex-1 min-w-0 overflow-hidden ${active ? "text-white" : (o.textColor || "text-neutral-300")}`} title={optionLabelText as string}>
                                        {o.label}
                                    </span>
                                    {active && (
                                        <Check className="ml-2 h-5 w-5 text-[#46D6C8] flex-shrink-0" />
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

