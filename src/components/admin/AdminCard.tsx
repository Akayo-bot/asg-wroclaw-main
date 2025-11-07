import React from 'react';

interface AdminCardProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export default function AdminCard({ title, icon, children, className = '' }: AdminCardProps) {
    return (
        <section
            className={[
                'relative overflow-hidden rounded-xl pointer-events-auto touch-auto transform-gpu',
                'bg-[#121816]/90 backdrop-blur',
                'ring-1 ring-[#46D6C8]/25',
                'p-4',
                'scan-line-effect animate-fade-in',
                className
            ].join(' ')}
        >
            {/* тонкий левый бар — фирменный штрих админки */}
            <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-[var(--adm-bar)] z-10" />

            <header className="relative z-10 flex items-center gap-2 border-b border-[#46D6C8]/10 pb-2 mb-3">
                {icon}
                <h3 className="text-[16px] font-semibold text-[#46D6C8]">{title}</h3>
            </header>

            <div className="relative z-10">
                {children}
            </div>
        </section>
    );
}
