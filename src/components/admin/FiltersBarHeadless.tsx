import { StatusSelect, StatusOption } from "./StatusSelect";
import { CategoryCombobox } from "./CategoryCombobox";

type Props = {
    q: string;
    onQ: (v: string) => void;
    status: StatusOption | "all";
    onStatus: (v: StatusOption | "all") => void;
    category: string | "all";
    onCategory: (v: string | "all") => void;
    onCreate: () => void;
    categories: { id: string; label: string }[];
};

export function FiltersBarHeadless({
    q, onQ, status, onStatus, category, onCategory, onCreate, categories,
}: Props) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
                <input
                    value={q}
                    onChange={(e) => onQ(e.target.value)}
                    placeholder="Пошук за заголовком або автором…"
                    className="w-full rounded-lg bg-neutral-900/60 px-3 py-2.5 text-sm outline-none
                               ring-1 ring-emerald-400/30 placeholder:text-neutral-500
                               hover:bg-neutral-900/75 hover:ring-emerald-400/50
                               focus:ring-emerald-400/60 focus:shadow-[0_0_10px_rgba(52,211,153,0.2)]
                               transition-all duration-200"
                />
                <div className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-neutral-500">
                    ⌘K
                </div>
            </div>
            {/* Status Select */}
            <StatusSelect value={status} onChange={onStatus} />
            {/* Category Combobox */}
            <CategoryCombobox
                value={category}
                onChange={onCategory}
                options={[{ id: "all", label: "Усі категорії" }, ...categories]}
            />
            {/* Create */}
            <button
                type="button"
                onClick={onCreate}
                className="rounded-lg bg-emerald-500/20 px-3 py-2.5 text-sm text-white
                           ring-1 ring-emerald-400/60 
                           hover:bg-emerald-500/30 hover:ring-emerald-400/70
                           shadow-[0_0_12px_rgba(52,211,153,0.25)]
                           hover:shadow-[0_0_16px_rgba(52,211,153,0.35)]
                           transition-all duration-200"
            >
                + Створити статтю
            </button>
        </div>
    );
}

