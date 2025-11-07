import React from 'react';

interface GlassCardProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export default function GlassCard({ title, icon, children, className = '' }: GlassCardProps) {
    return (
        <section
            className={[
                'relative rounded-2xl p-0 overflow-hidden ring-1',
                'ring-[var(--adm2-stroke)] bg-[var(--adm2-card)] backdrop-blur',
                className
            ].join(' ')}
        >
            {/* header ribbon */}
            <div className="relative flex items-center gap-2 px-5 py-3">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/15 via-transparent to-transparent" />
                <div className="absolute right-0 top-0 h-full w-28 -skew-x-12 bg-cyan-400/10" />
                {icon}
                <h3 className="text-[17px] font-semibold text-cyan-100 relative z-10">{title}</h3>
            </div>

            {/* subtle grid + scanlines */}
            <div className="relative px-5 pb-4 pt-3">
                <div className="pointer-events-none absolute inset-0 opacity-[.06]">
                    <svg width="100%" height="100%">
                        <defs>
                            <pattern id="grid2" width="28" height="28" patternUnits="userSpaceOnUse">
                                <path d="M28 0H0v28" stroke="currentColor" strokeWidth=".8" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid2)" className="text-cyan-300" />
                    </svg>
                </div>
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,.05),transparent)] bg-[length:100%_32px] animate-[scan_6s_linear_infinite]" />
                <div className="relative z-10">{children}</div>
            </div>

            {/* diagonal cut bottom-right */}
            <div className="pointer-events-none absolute bottom-0 right-0 h-10 w-20 -skew-x-12 bg-cyan-400/10" />
            <div className="pointer-events-none absolute bottom-2 right-3 h-1 w-16 bg-cyan-400/50 blur-[2px]" />
        </section>
    );
}

