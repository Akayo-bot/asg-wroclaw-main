import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";

type N = { id: string; title: string; ts: string; unread?: boolean; };

export function Notifications({ items }: { items: N[] }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        window.addEventListener("click", onClick);
        return () => window.removeEventListener("click", onClick);
    }, []);
    const unread = items.filter(i => i.unread).length;

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(v => !v)}
                className="relative rounded-lg px-2 py-2 ring-1 ring-emerald-400/25 bg-neutral-900/60 hover:ring-emerald-400/40">
                <Bell className="h-5 w-5 text-emerald-300" />
                {unread > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-black text-[11px] flex items-center justify-center">{unread}</span>}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-[300px] rounded-xl bg-[#101614] ring-1 ring-emerald-400/25 shadow-lg p-2 z-50">
                    <div className="px-2 py-1 text-sm text-emerald-100">Нотифікації</div>
                    <ul className="max-h-[280px] overflow-auto divide-y divide-emerald-400/10">
                        {items.length === 0 && <li className="p-3 text-sm text-neutral-400">Поки порожньо</li>}
                        {items.map(n => (
                            <li key={n.id} className="p-3 hover:bg-neutral-900/50 rounded-md">
                                <div className="text-sm text-neutral-200">{n.title}</div>
                                <div className="text-xs text-neutral-500">{new Date(n.ts).toLocaleString("uk-UA")}</div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

