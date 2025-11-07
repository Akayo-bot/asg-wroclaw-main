import React from 'react';

interface CommandButtonSoftProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}

export function CommandButtonSoft({ icon, label, onClick }: CommandButtonSoftProps) {
    return (
        <button
            onClick={onClick}
            tabIndex={0}
            aria-label={label}
            type="button"
            className="group mt-3 w-full rounded-lg bg-neutral-900/70 px-3 py-2.5 text-left text-neutral-200 ring-1 ring-[#46D6C8]/25 hover:bg-neutral-900 hover:ring-[#46D6C8]/45 transition focus:outline-none focus:ring-2 focus:ring-[#46D6C8]/50 pointer-events-auto cursor-target touch-auto"
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            <span className="inline-flex items-center gap-2">
                {icon}
                {label}
            </span>
            <span className="float-right text-[#46D6C8] transition-transform group-hover:translate-x-0.5">›</span>
        </button>
    );
}
