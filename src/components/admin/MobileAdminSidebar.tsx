import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
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
    const { t } = useI18n();

    useLockBodyScroll(open);

    const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            action();
        }
    };

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
          bg-gradient-to-b from-[rgba(70,214,200,0.10)] via-[rgba(70,214,200,0.06)] to-transparent
          border-r border-[rgba(70,214,200,0.12)]
          backdrop-blur-xl
          shadow-[0_10px_30px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.05)]
          pt-[max(12px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))]
          flex flex-col
        `}
                style={{ transform: open ? `translateX(${dragX}px)` : undefined }}
            >
                {/* Основная навигация */}
                <nav className="flex-1 px-2 pt-4 pb-0 space-y-1 overflow-y-auto overscroll-contain">
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
                                        ? 'text-[#46D6C8] border-[#46D6C8]/30 bg-[#46D6C8]/20 shadow-[0_0_16px_rgba(70,214,200,0.15)_inset]'
                                        : 'text-slate-200/85 border-white/5 hover:text-[#46D6C8] hover:border-[#46D6C8]/25 hover:bg-[#46D6C8]/10'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-[15px] font-medium">{label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Кнопка "На головну" внизу сайдбара */}
                <div className="px-4 pb-8 pt-8 border-t border-white/10 lg:hidden">
                    <Link
                        to="/"
                        onClick={onClose}
                        className="btn-home nav-link inline-flex items-center gap-2 cursor-target"
                        tabIndex={0}
                        aria-label={t('nav.home', 'На головну')}
                        onKeyDown={(e) => handleKeyDown(e, () => {
                            window.location.href = '/';
                            onClose();
                        })}
                        data-brackets
                    >
                        <Home className="h-4 w-4" />
                        <span>{t('nav.home', 'На головну')}</span>
                    </Link>
                </div>
            </aside>
        </>
    );
};

export default MobileAdminSidebar;
