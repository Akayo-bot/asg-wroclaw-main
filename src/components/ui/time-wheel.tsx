import React, { useEffect, useRef } from "react";

interface TimeWheelProps {
    label: string;
    value?: number;
    onChange: (v: number) => void;
    range: [number, number];
    pad?: boolean;
    className?: string;
}

export function TimeWheel({
    label,
    value,
    onChange,
    range,
    pad = false,
    className = "",
}: TimeWheelProps) {
    const [min, max] = range;
    const items = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    const scrollRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<number, HTMLLIElement>>(new Map());

    // Автоматическая прокрутка к выбранному элементу
    useEffect(() => {
        if (value == null || !scrollRef.current) return;
        
        const itemElement = itemRefs.current.get(value);
        if (itemElement) {
            const container = scrollRef.current;
            const itemTop = itemElement.offsetTop;
            const itemHeight = itemElement.offsetHeight;
            const containerHeight = container.clientHeight;
            const scrollPosition = itemTop - (containerHeight / 2) + (itemHeight / 2);
            
            container.scrollTo({
                top: scrollPosition,
                behavior: 'smooth'
            });
        }
    }, [value]);

    return (
        <div className={`select-none ${className}`}>
            <div className="text-[11px] mb-1 text-[#46D6C8]/60">{label}</div>
            <div 
                ref={scrollRef}
                className="relative h-36 w-full overflow-y-auto
                            rsf-wheel border border-[#46D6C8]/20 rounded-xl
                            bg-black/40 pl-1 pr-2 no-scrollbar"
                >
                <ul className="py-2">
                    {items.map((n) => {
                        const active = n === value;
                        return (
                            <li 
                                key={n}
                                ref={(el) => {
                                    if (el) itemRefs.current.set(n, el);
                                    else itemRefs.current.delete(n);
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => onChange(n)}
                                    className={`w-full h-8 flex items-center justify-center rounded-md mx-1
                                                transition-all duration-200
                                                ${active
                                            ? "text-[#46D6C8] font-semibold bg-[#46D6C8]/20 ring-1 ring-[#46D6C8]/40"
                                            : "text-gray-400 hover:bg-white/5 hover:text-[#46D6C8]"}`}
                                >
                                    {pad ? String(n).padStart(2, "0") : n}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
            {/* +/- */}
            <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                    type="button"
                    className="rsf-ghost-btn"
                    onClick={() => {
                        if (value == null) return onChange(min);
                        const next = value + 1 > max ? min : value + 1;
                        onChange(next);
                    }}
                >
                    +1
                </button>
                <button
                    type="button"
                    className="rsf-ghost-btn"
                    onClick={() => {
                        if (value == null) return onChange(min);
                        const next = value - 1 < min ? max : value - 1;
                        onChange(next);
                    }}
                >
                    -1
                </button>
            </div>
        </div>
    );
}

