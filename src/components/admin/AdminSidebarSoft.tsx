import React from 'react';

interface SidebarItem {
    id: string;
    label: string;
    icon: React.ReactNode;
}

interface AdminSidebarSoftProps {
    items: SidebarItem[];
    active: string;
    onSelect: (id: string) => void;
}

export function AdminSidebarSoft({ items, active, onSelect }: AdminSidebarSoftProps) {
    return (
        <aside className="w-[240px] shrink-0 rounded-xl bg-[#121816]/90 ring-1 ring-emerald-400/25 p-3">
            <nav className="space-y-1">
                {items.map((it) => {
                    const isActive = it.id === active;
                    return (
                        <button
                            key={it.id}
                            onClick={() => onSelect(it.id)}
                            tabIndex={0}
                            aria-label={it.label}
                            aria-current={isActive ? 'page' : undefined}
                            className={`group relative w-full flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${isActive
                                    ? 'bg-emerald-500/10 text-emerald-100 ring-1 ring-emerald-400/30'
                                    : 'text-neutral-300 hover:text-emerald-200 hover:bg-neutral-900/60'
                                }`}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onSelect(it.id);
                                }
                            }}
                        >
                            <span
                                className={`absolute left-0 top-0 h-full w-[3px] rounded-l-md transition ${isActive ? 'bg-emerald-400/60' : 'bg-transparent'
                                    }`}
                            />
                            <span className={`relative z-10 ${isActive ? 'text-emerald-300' : 'text-emerald-300/70'}`}>
                                {it.icon}
                            </span>
                            <span className="relative z-10">{it.label}</span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
