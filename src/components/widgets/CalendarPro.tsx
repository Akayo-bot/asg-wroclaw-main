import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type EventDay = {
    date: string;        // "2025-11-03"
    title: string;
    kind?: "game" | "training" | "meeting";
    importance?: "normal" | "high";
};

function pad(n: number) { return n.toString().padStart(2, "0"); }
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function ymd(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

export default function CalendarPro({
    fetchUrl = "/api/events",
    events: initial = [],
    onSelect,
}: {
    fetchUrl?: string;                 // /api/events?from=YYYY-MM-01&to=YYYY-MM-31
    events?: EventDay[];
    onSelect?: (isoDate: string, dayEvents: EventDay[]) => void;
}) {
    const today = ymd(new Date());
    const startNow = new Date();
    const [y, setY] = useState(startNow.getFullYear());
    const [m, setM] = useState(startNow.getMonth());
    const [events, setEvents] = useState<EventDay[]>(initial);

    // авто-підвантаження подій поточного місяця
    useEffect(() => {
        (async () => {
            try {
                const from = `${y}-${pad(m + 1)}-01`;
                const to = `${y}-${pad(m + 1)}-${pad(daysInMonth(y, m))}`;
                const res = await fetch(`${fetchUrl}?from=${from}&to=${to}`);
                if (res.ok) {
                    const data = await res.json();
                    setEvents((Array.isArray(data) ? data : []).map((e: any) => ({
                        date: e.date, title: e.title, kind: e.kind || "game", importance: e.importance || "normal"
                    })));
                }
            } catch {/* тихо */ }
        })();
    }, [y, m, fetchUrl]);

    const grid = useMemo(() => {
        const first = new Date(y, m, 1);
        const startIdx = (first.getDay() + 6) % 7; // Пн=0
        const total = daysInMonth(y, m);
        return Array.from({ length: 42 }, (_, i) => {
            const d = i - startIdx + 1;
            const inMonth = d >= 1 && d <= total;
            const iso = inMonth ? `${y}-${pad(m + 1)}-${pad(d)}` : "";
            return { d: inMonth ? d : null, inMonth, iso };
        });
    }, [y, m]);

    const evMap = useMemo(() => {
        const map: Record<string, EventDay[]> = {};
        events.forEach(e => {
            (map[e.date] ||= []).push(e);
        });
        return map;
    }, [events]);

    const monthLabel = new Date(y, m, 1).toLocaleString("uk-UA", { month: "long", year: "numeric" });

    return (
        <div className="relative z-[2] pointer-events-auto rounded-xl bg-[#121816]/90 ring-1 ring-emerald-400/25 p-4 w-full max-w-full h-full flex flex-col cursor-target touch-auto transform-gpu">
            {/* header */}
            <div className="flex items-center justify-between mb-3">
                <button type="button"
                    onClick={() => { setY(m === 0 ? y - 1 : y); setM(m === 0 ? 11 : m - 1); }}
                    className="grid place-items-center h-9 w-9 rounded-lg bg-neutral-900/60 ring-1 ring-emerald-400/25 hover:ring-emerald-400/45 cursor-target pointer-events-auto"
                    aria-label="Попередній місяць"
                >
                    <ChevronLeft className="h-4 w-4 text-emerald-300" />
                </button>

                <div className="text-emerald-100 text-base font-medium capitalize">{monthLabel}</div>

                <button type="button"
                    onClick={() => { setY(m === 11 ? y + 1 : y); setM(m === 11 ? 0 : m + 1); }}
                    className="grid place-items-center h-9 w-9 rounded-lg bg-neutral-900/60 ring-1 ring-emerald-400/25 hover:ring-emerald-400/45 cursor-target pointer-events-auto"
                    aria-label="Наступний місяць"
                >
                    <ChevronRight className="h-4 w-4 text-emerald-300" />
                </button>
            </div>

            {/* week header */}
            <div className="grid grid-cols-7 gap-1 text-xs text-emerald-200/70 mb-1">
                {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map(d => (
                    <div key={d} className="text-center">{d}</div>
                ))}
            </div>

            {/* days grid */}
            <div className="grid grid-cols-7 gap-1">
                {grid.map((cell, i) => {
                    const dayEvents = cell.iso ? (evMap[cell.iso] || []) : [];
                    const isToday = cell.iso === today;
                    const hasGames = dayEvents.some(e => e.kind === "game");
                    const count = dayEvents.length;

                    return (
                        <button type="button"
                            key={i}
                            disabled={!cell.inMonth}
                            onClick={() => cell.iso && onSelect?.(cell.iso, dayEvents)}
                            className={[
                                "relative h-11 sm:h-12 rounded-md text-sm",
                                "flex items-center justify-center",
                                cell.inMonth ? "bg-neutral-900/60 ring-1 ring-emerald-400/10 text-neutral-200 hover:ring-emerald-400/30" : "bg-transparent text-neutral-600",
                                isToday ? "ring-emerald-400/60 bg-emerald-500/10 shadow-[0_0_0_2px_rgba(16,185,129,.15)_inset]" : "",
                            ].join(" ") + " cursor-target pointer-events-auto touch-auto"}
                        >
                            {cell.d}

                            {/* підсвітка ігор */}
                            {hasGames && (
                                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-3 rounded-full bg-emerald-400/90" />
                            )}

                            {/* лічильник усіх подій у день (якщо >1) */}
                            {count > 1 && (
                                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full
                                  bg-emerald-500 text-black text-[11px] grid place-items-center">
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* легенда */}
            <div className="mt-3 flex items-center gap-4 text-xs text-neutral-400">
                <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-3 rounded-full bg-emerald-400/90" /> Подія (гра)
                </span>
                <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full ring-2 ring-emerald-400/60 bg-emerald-500/10 block" /> Сьогодні
                </span>
            </div>
        </div>
    );
}

