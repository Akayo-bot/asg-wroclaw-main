import React from 'react';
import { ChevronRight } from 'lucide-react';

interface CommandButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}

export const CommandButton = ({ icon, label, onClick }: CommandButtonProps) => {
    return (
        <button
            onClick={onClick}
            tabIndex={0}
            aria-label={label}
            className="group w-full rounded-xl bg-[#0c1112]/70 ring-1 ring-cyan-400/25 px-3 py-3 text-left text-neutral-200 hover:ring-cyan-400/45 hover:bg-[#0c1112]/90 transition-all flex items-center justify-between"
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            <span className="flex items-center gap-2">
                {icon}
                <span>{label}</span>
            </span>
            <ChevronRight className="h-4 w-4 text-cyan-300 group-hover:translate-x-0.5 transition-transform" />
        </button>
    );
};



