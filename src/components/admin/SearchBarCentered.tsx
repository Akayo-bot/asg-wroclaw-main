import React from "react";

export function SearchBarCentered({
    value, onChange, onSubmit,
}: { value: string; onChange: (v: string) => void; onSubmit?: () => void; }) {
    return (
        <div className="mx-auto max-w-3xl pb-4">
            <div className="relative">
                <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onSubmit?.()}
                    placeholder="Пошук за заголовком або автором…"
                    className="w-full rounded-lg bg-neutral-900/70 px-4 py-3 text-sm
                               ring-1 ring-neutral-700/50 placeholder:text-neutral-500
                               hover:bg-neutral-900/80 focus:outline-none focus:ring-neutral-500/60"
                />
                {onSubmit && (
                    <button
                        type="button"
                        onClick={onSubmit}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md
                                   bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300
                                   ring-1 ring-neutral-700/50 hover:bg-neutral-700"
                    >
                        Шукати
                    </button>
                )}
            </div>
        </div>
    );
}

