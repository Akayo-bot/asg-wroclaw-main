nom import React from 'react';

interface SidebarItem {
    id: string;
    label: string;
    icon: React.ReactNode;
}

interface SidebarV2Props {
    items: SidebarItem[];
    active: string;
    onSelect: (id: string) => void;
}

export const SidebarV2 = ({ items, active, onSelect }: SidebarV2Props) => {
    return (
        <aside className="w-[240px] shrink-0 rounded-2xl bg-[#0d1112]/80 ring-1 ring-cyan-400/25 backdrop-blur p-3">
            <nav className="space-y-1">
                {items.map((it) => {
                    const is = it.id === active;
                    return (
                        <button
                            key={it.id}
                            onClick={() => onSelect(it.id)}
                            tabIndex={0}
                            aria-label={it.label}
                            aria-current={is ? 'page' : undefined}
                            className={`group relative w-full rounded-xl px-3 py-2 flex items-center gap-2 text-sm transition-all ${is
                                    ? 'text-cyan-100 bg-cyan-500/10 ring-1 ring-cyan-400/40'
                                    : 'text-neutral-300 hover:bg-neutral-900/60 ring-1 ring-white/10 hover:ring-cyan-400/25'
                                }`}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onSelect(it.id);
                                }
                            }}
                        >
                            <span className={`absolute left-0 top-0 h-full w-[3px] ${is ? 'bg-cyan-400' : 'bg-transparent'} rounded-l-xl`} />
                            <span className={`relative z-10 ${is ? 'text-cyan-300' : 'text-cyan-300/70'}`}>{it.icon}</span>
                            <span className="relative z-10">{it.label}</span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
};

