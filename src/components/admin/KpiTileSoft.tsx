import React from 'react';

interface KpiTileSoftProps {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ReactNode;
}

export function KpiTileSoft({ label, value, sub, icon }: KpiTileSoftProps) {
    return (
        <div className="relative rounded-xl bg-[#121816]/90 ring-1 ring-emerald-400/25 p-4 h-[112px] flex flex-col overflow-hidden scan-line-effect animate-fade-in pointer-events-auto touch-auto transform-gpu">
            <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-[var(--adm-bar)]" />

            <div className="relative z-10 flex items-start justify-between">
                <span className="text-sm text-emerald-200/70">{label}</span>
                <div className="text-emerald-300/80">{icon}</div>
            </div>

            <div className="relative z-10 mt-2 text-3xl font-semibold text-emerald-100">{value}</div>

            {sub && <div className="relative z-10 mt-auto text-xs text-neutral-400">{sub}</div>}
        </div>
    );
}
