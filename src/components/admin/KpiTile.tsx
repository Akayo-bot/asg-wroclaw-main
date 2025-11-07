import React from 'react';

interface KpiTileProps {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ReactNode;
}

export const KpiTile = ({ label, value, sub, icon }: KpiTileProps) => {
    return (
        <div className="relative rounded-2xl p-4 ring-1 ring-[var(--adm2-stroke)] bg-[var(--adm2-card)] backdrop-blur overflow-hidden transition-all hover:shadow-[0_0_36px_-12px_var(--adm2-glow)] hover:ring-cyan-400/45">
            <div className="absolute left-0 top-0 h-full w-[3px] bg-cyan-400/40" />

            <div className="flex items-start justify-between">
                <div className="text-sm text-cyan-200/70">{label}</div>
                <div className="text-cyan-200/80">{icon}</div>
            </div>

            <div className="mt-2 text-3xl font-semibold text-cyan-100">{value}</div>

            {sub && <div className="mt-1 text-xs text-neutral-400">{sub}</div>}
        </div>
    );
};

