import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';

interface MobileAdminSidebarProps {
    open: boolean;
    onClose: () => void;
    menuItems: { icon: React.ElementType; label: string; path: string }[];
    isActive: (path: string) => boolean;
}

const MobileAdminSidebar = ({ open, onClose, menuItems, isActive }: MobileAdminSidebarProps) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const [dragX, setDragX] = useState(0);

    useLockBodyScroll(open);

    // ESC для закрытия
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    // Примитивный свайп с левого края
    useEffect(() => {
        if (!open) return;
        const panel = panelRef.current;
        if (!panel) return;

        let startX = 0;
        let isDragging = false;

        const onStart = (e: TouchEvent) => {
            startX = e.touches[0].clientX;
            isDragging = true;
        };
        const onMove = (e: TouchEvent) => {
            if (!isDragging) return;
            const dx = e.touches[0].clientX - startX;
            setDragX(Math.min(0, dx));
        };
        const onEnd = () => {
            isDragging = false;
            if (Math.abs(dragX) > 60) onClose();
            setDragX(0);
        };
        panel.addEventListener('touchstart', onStart);
        panel.addEventListener('touchmove', onMove);
        panel.addEventListener('touchend', onEnd);
        return () => {
            panel.removeEventListener('touchstart', onStart);
            panel.removeEventListener('touchmove', onMove);
            panel.removeEventListener('touchend', onEnd);
        };
    }, [open, dragX, onClose]);

    return (
        <>
            {/* Overlay только на мобиле */}
            <div
                aria-hidden={!open}
                onClick={onClose}
                className={`fixed inset-0 z-[70] lg:hidden transition
          ${open
                        ? 'opacity-100 pointer-events-auto bg-black/50 backdrop-blur-sm'
                        : 'hidden opacity-0 pointer-events-none bg-transparent backdrop-blur-0'
                    }`}
            />

            {/* Панель: на lg статична, на мобиле — drawer */}
            <aside
                ref={panelRef}
                className={`
          fixed lg:hidden z-[75]
          top-[72px] left-0 h-[calc(100dvh-72px)]
          w-[82%] max-w-[300px]
          translate-x-[-100%]
          ${open ? 'translate-x-0' : ''}
          ${open ? 'pointer-events-auto' : 'pointer-events-none'}
          transition-transform will-change-transform
          bg-gradient-to-b from-[rgba(16,185,129,0.10)] via-[rgba(16,185,129,0.06)] to-transparent
          border-r border-[rgba(0,255,136,0.12)]
          backdrop-blur-xl
          shadow-[0_10px_30px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.05)]
          pt-[max(12px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))]
        `}
                style={{ transform: open ? `translateX(${dragX}px)` : undefined }}
            >
                {/* Header внутри панели */}
                <div className="px-4 pb-3 flex items-center gap-2">
                    <div className="size-8 rounded-xl bg-emerald-500/15 border border-emerald-400/20 grid place-items-center text-emerald-400 font-bold">A</div>
                    <div className="font-semibold text-emerald-200">Адміністрування</div>
                </div>

                <nav className="px-2 space-y-1 overflow-y-auto overscroll-contain max-h-[calc(100dvh-80px)]">
                    {menuItems.map(({ icon: Icon, label, path }) => {
                        const active = isActive(path);
                        return (
                            <Link
                                key={path}
                                to={path}
                                onClick={onClose}
                                className={`group flex items-center gap-3 px-3 py-2 rounded-xl
                  border transition cursor-target
                  ${active
                                        ? 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10 shadow-[0_0_16px_rgba(0,255,136,0.15)_inset]'
                                        : 'text-slate-200/85 border-white/5 hover:text-emerald-300 hover:border-emerald-400/25 hover:bg-emerald-500/5'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-[15px] font-medium">{label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
};

export default MobileAdminSidebar;
