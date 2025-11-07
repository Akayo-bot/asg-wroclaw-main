import { useMemo, useState } from "react";

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function pad(n: number) { return n.toString().padStart(2, "0"); }

export function MiniCalendar({ events }: {
    events?: { date: string; title: string }[]; // date: "2025-10-29"
}) {
    const now = new Date();
    const [ym, setYm] = useState<[number, number]>([now.getFullYear(), now.getMonth()]);
    const [y, m] = ym;

    const grid = useMemo(() => {
        const first = new Date(y, m, 1);
        const startIdx = (first.getDay() + 6) % 7; // Пн=0
        const total = daysInMonth(y, m);
        const arr = Array.from({ length: 42 }, (_, i) => {
            const d = i - startIdx + 1;
            const inMonth = d >= 1 && d <= total;
            const date = inMonth ? `${y}-${pad(m + 1)}-${pad(d)}` : "";
            return { d: inMonth ? d : null, inMonth, date };
        });
        return arr;
    }, [y, m]);

    const evMap = useMemo(() => {
        const map: Record<string, number> = {};
        events?.forEach(e => map[e.date] = (map[e.date] || 0) + 1);
        return map;
    }, [events]);

    return (
        <div className="rounded-xl bg-[#121816]/90 ring-1 ring-emerald-400/25 p-4">
            <div className="flex items-center justify-between mb-3">
                <button onClick={() => setYm([y, m === 0 ? 11 : m - 1 === 11 ? y - 1 : y, m === 0 ? 11 : m - 1] as any)}
                    className="px-2 py-1 rounded bg-neutral-900/60 ring-1 ring-emerald-400/25">‹</button>
                <div className="text-emerald-100">{new Date(y, m, 1).toLocaleString("uk-UA", { month: "long", year: "numeric" })}</div>
                <button onClick={() => setYm([m === 11 ? y + 1 : y, m === 11 ? 0 : m + 1] as any)}
                    className="px-2 py-1 rounded bg-neutral-900/60 ring-1 ring-emerald-400/25">›</button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-xs text-emerald-200/70 mb-1">
                {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map(d => <div key={d} className="text-center">{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {grid.map((cell, i) => (
                    <div key={i}
                        className={`h-9 rounded-md text-sm flex items-center justify-center
                        ${cell.inMonth ? "bg-neutral-900/60 ring-1 ring-emerald-400/10" : "bg-transparent text-neutral-600"}`}>
                        {cell.d}
                        {cell.date && evMap[cell.date] && (
                            <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

