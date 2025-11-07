import React from 'react';

export default function AdminShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-dvh bg-neutral-950 text-neutral-100">
            {/* Content area offset for topbar (pt-16 = 64px for h-14 topbar + gap) and sidebar */}
            <main
                className="relative pt-16 lg:pl-[300px] xl:pl-[320px]"
                style={{ contain: 'layout paint' as any }}
            >
                {children}
            </main>
        </div>
    );
}


