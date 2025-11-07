import React from 'react';

interface ChipProps {
    tone?: 'ok' | 'warn' | 'bad';
    children: React.ReactNode;
}

export const Chip = ({ tone = 'ok', children }: ChipProps) => {
    const m = {
        ok: 'bg-emerald-500/12 text-emerald-300 ring-emerald-400/40',
        warn: 'bg-amber-500/12 text-amber-300 ring-amber-400/40',
        bad: 'bg-rose-500/12 text-rose-300 ring-rose-400/40'
    }[tone];

    return (
        <span className={`rounded-full px-2.5 py-0.5 text-xs ring-1 ${m}`}>
            {children}
        </span>
    );
};



