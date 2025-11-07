type Item = {
    id: string;
    actor: string;               // Akayo
    action: "created" | "updated" | "deleted" | "role_changed";
    target: string;              // "Стаття 'ASG Wrocław Game'"
    ts: string;                  // ISO
};

const colorBy: Record<Item["action"], string> = {
    created: "text-emerald-300",
    updated: "text-sky-300",
    deleted: "text-rose-300",
    role_changed: "text-amber-300",
};

export function ActivityFeed({ items }: { items: Item[] }) {
    return (
        <div className="relative z-[2] pointer-events-auto rounded-xl bg-[#121816]/90 ring-1 ring-emerald-400/25 p-4 h-full flex flex-col touch-auto transform-gpu">
            <div className="text-[15px] font-semibold text-emerald-100 mb-2">Останні дії</div>
            <ul className="divide-y divide-emerald-400/10 flex-1 overflow-auto">
                {items.map(it => (
                    <li key={it.id} className="py-2 flex items-start gap-3">
                        <span className={`mt-1 h-2 w-2 rounded-full ${it.action === "deleted" ? "bg-rose-400" : it.action === "updated" ? "bg-sky-400" : it.action === "role_changed" ? "bg-amber-400" : "bg-emerald-400"}`} />
                        <div className="flex-1">
                            <div className="text-sm text-neutral-300">
                                <span className="text-emerald-200/90">{it.actor}</span>{" "}
                                <span className={colorBy[it.action]}>
                                    {it.action === "created" && "створив(ла)"}
                                    {it.action === "updated" && "оновив(ла)"}
                                    {it.action === "deleted" && "видалив(ла)"}
                                    {it.action === "role_changed" && "змінив(ла) роль у"}
                                </span>{" "}
                                <span className="text-neutral-200">{it.target}</span>
                            </div>
                            <div className="text-xs text-neutral-500">
                                {new Date(it.ts).toLocaleString("uk-UA")}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}


