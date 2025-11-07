import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { LayoutDashboard, FileText, Images, Calendar, Users, UserCog, ChartBar as BarChart3, Settings, Palette, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TargetCursor from '@/components/TargetCursor';
import { autoTargetInteractiveElements } from '@/utils/autoTarget';
import AdminNavbar from '@/components/admin/AdminNavbar';
import MobileAdminSidebar from '@/components/admin/MobileAdminSidebar';

const AdminLayout = () => {
    const { user, profile, loading, signOut } = useAuth();
    const { t } = useI18n();
    const location = useLocation();
    const { toast } = useToast();
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    useEffect(() => {
        // Show insufficient permissions message (только один раз при изменении loading/user/profile)
        if (!loading && user && profile && profile.role !== 'superadmin' && profile.role !== 'admin' && profile.role !== 'editor') {
            toast({
                title: t('errors.insufficientPermissions', 'Insufficient Permissions'),
                description: t('errors.adminAccessRequired', 'Admin or Editor access required'),
                variant: 'destructive'
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, user, profile]); // ✅ Убраны toast и t из зависимостей, чтобы избежать циклов

    // Initialize cursor targeting
    useEffect(() => {
        if (typeof window !== 'undefined' && document) {
            const timer = setTimeout(() => {
                const cleanup = autoTargetInteractiveElements();
                return cleanup;
            }, 100);

            return () => clearTimeout(timer);
        }
    }, []);

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Redirect unauthenticated users to auth page with return URL
    if (!user || !profile) {
        const returnUrl = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/auth?returnUrl=${returnUrl}`} replace />;
    }

    // Redirect users without proper role to home with message
    if (!['superadmin', 'admin', 'editor'].includes(profile.role)) {
        return <Navigate to="/" replace />;
    }

    const menuItems = [
        { icon: LayoutDashboard, label: t('admin.dashboard', 'Панель керування'), path: '/admin' },
        { icon: FileText, label: t('admin.articles', 'Статті'), path: '/admin/articles' },
        { icon: Shield, label: t('admin.roles.title', 'Управління ролями'), path: '/admin/roles' },
        { icon: Palette, label: t('admin.branding.title', 'Управління брендом'), path: '/admin/branding' },
        { icon: Settings, label: t('admin.translations.title', 'Переклади'), path: '/admin/translations' },
        { icon: Images, label: t('admin.gallery', 'Галерея'), path: '/admin/gallery' },
        { icon: Calendar, label: t('admin.events', 'Події'), path: '/admin/events' },
        { icon: Users, label: t('admin.team', 'Команда'), path: '/admin/team' },
        { icon: BarChart3, label: t('admin.statistics', 'Статистика'), path: '/admin/stats' },
    ];

    const isActive = (path: string) => {
        if (path === '/admin') {
            return location.pathname === '/admin';
        }
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const [isDesktopCursor, setIsDesktopCursor] = useState<boolean>(true);

    useEffect(() => {
        const mq = window.matchMedia('(pointer: fine) and (hover: hover) and (min-width: 768px)');
        const update = () => setIsDesktopCursor(mq.matches);
        update();
        mq.addEventListener?.('change', update);
        return () => mq.removeEventListener?.('change', update);
    }, []);

    return (
        <>
            {isDesktopCursor && (
                <TargetCursor
                    targetSelector=".cursor-target, [data-logout-button]"
                    spinDuration={2}
                    hideDefaultCursor={true}
                />
            )}
            <AdminNavbar
                onMenuClick={() => {
                    console.log('Menu button clicked, toggling sidebar');
                    setMobileSidebarOpen(prev => !prev);
                }}
                isMenuOpen={mobileSidebarOpen}
            />
            {/* Mobile Sidebar - only visible on mobile */}
            <MobileAdminSidebar
                open={mobileSidebarOpen}
                onClose={() => {
                    console.log('Closing sidebar');
                    setMobileSidebarOpen(false);
                }}
                menuItems={menuItems}
                isActive={isActive}
            />
            <div className="min-h-screen flex w-full bg-[var(--adm-bg)]">
                {/* Desktop Sidebar - hidden on mobile */}
                {/* Закрепленная навигация */}
                <div className="fixed top-[112px] left-[12px] lg:w-[300px] xl:w-[320px] lg:left-[12px] p-4 overflow-visible z-[90] bg-neutral-950/85 backdrop-blur-sm rounded-2xl hidden lg:block ring-1 ring-emerald-400/30 shadow-[0_0_40px_rgba(16,185,129,.15)]">
                    {/* Тонкая сетка */}
                    <div
                        className="pointer-events-none absolute inset-0 opacity-[0.06] rounded-2xl"
                        style={{
                            background: `
                                radial-gradient(circle at 20% 0%, #10b981 0, transparent 40%),
                                linear-gradient(transparent 23px, #0a0a0a 24px),
                                linear-gradient(90deg, transparent 23px, #0a0a0a 24px)
                            `,
                            backgroundSize: '400px 400px, 24px 24px, 24px 24px'
                        }}
                    />
                    <nav className="space-y-2.5 overflow-visible">
                        {menuItems.map((item) => {
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    aria-current={active ? 'page' : undefined}
                                    data-active={active ? 'true' : undefined}
                                    className={`group relative flex items-center gap-3 rounded-2xl px-4 py-4 overflow-visible
                                            bg-neutral-900/70 ring-1 ring-emerald-400/15 shadow-[inset_0_0_10px_rgba(16,185,129,.10)]
                                            transition-colors duration-200 cursor-target
                                            md:hover:bg-neutral-900/85 md:hover:ring-emerald-400/50 md:hover:shadow-[0_0_20px_rgba(16,185,129,.25),inset_0_0_12px_rgba(16,185,129,.15)]
                                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-0
                                            data-[active=true]:bg-teal-100 data-[active=true]:border-l-4 data-[active=true]:border-l-teal-300 data-[active=true]:animate-neon-pulse rounded-r-lg
                                            data-[active=true]:shadow-[0_0_22px_rgba(70,214,200,.26),inset_0_0_12px_rgba(70,214,200,.14)]
                                            motion-reduce:transition-none
                                            ${active ? 'isolate' : ''}`}
                                >
                                    {/* Иконка-капсула */}
                                    <span className="relative z-10 grid place-items-center size-10 rounded-full
                                            bg-black/45 ring-1 ring-emerald-300/30
                                            shadow-[0_0_14px_rgba(16,185,129,.20)]
                                            transition-transform duration-150
                                            md:group-hover:ring-emerald-300/45 md:group-hover:shadow-[0_0_28px_rgba(16,185,129,.40)]
                                            data-[active=true]:shadow-[0_0_22px_rgba(16,185,129,.42)]"
                                    >
                                        {/* Радиальный градиент для свечения */}
                                        <span
                                            className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,.38),transparent_65%)]
                                                    opacity-50 md:group-hover:opacity-75 transition-opacity duration-150"
                                        />
                                        <item.icon
                                            className="relative z-10 size-[18px] text-emerald-300
                                                    md:group-hover:text-emerald-200
                                                    md:group-hover:drop-shadow-[0_0_12px_rgba(16,185,129,.80)]
                                                    md:group-hover:scale-110
                                                    transition-all duration-150"
                                        />
                                    </span>

                                    {/* Текст */}
                                    <span className="relative z-10 flex-1 text-[15px] font-medium text-slate-200
                                            md:group-hover:text-white md:group-hover:font-semibold transition-all duration-200">
                                        {item.label}
                                    </span>


                                    {/* ВНЕШНИЙ glow-слой (за элементом!) */}
                                    <span className="pointer-events-none absolute -inset-1 -z-10 rounded-2xl opacity-0
                                            md:group-hover:opacity-100 transition-opacity duration-300
                                            bg-emerald-400/20 blur-md" />

                                    {/* Периметр для АКТИВНОГО: бегущий конус */}
                                    <span
                                        className="pointer-events-none absolute inset-0 -z-10 rounded-2xl p-[1px]
                                                opacity-0 data-[active=true]:opacity-100
                                                [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000,#000)]
                                                [mask-composite:exclude]
                                                before:absolute before:-inset-px before:rounded-[22px]
                                                before:bg-[conic-gradient(from_0deg,transparent_0,transparent_76%,#34d399_86%,transparent_95%)]
                                                motion-safe:before:animate-[spin_7.2s_linear_infinite]
                                                motion-reduce:before:animate-none"
                                    />

                                    {/* FILL (внутренняя заливка) */}
                                    {active && (
                                        <span
                                            className="pointer-events-none absolute inset-0 rounded-2xl"
                                            style={{
                                                zIndex: 0,
                                                backgroundColor: 'rgba(6, 95, 70, 0.05)',
                                                opacity: 0.05,
                                                boxShadow: 'inset 0 0 8px rgba(16, 185, 129, 0.08)',
                                                animation: 'neon-pulse-fill 4s ease-in-out infinite',
                                                willChange: 'opacity, background-color, box-shadow',
                                            }}
                                        />
                                    )}

                                    {/* BORDER (наружное свечение) */}
                                    {active && (
                                        <span
                                            className="pointer-events-none absolute -inset-[1px] rounded-2xl"
                                            style={{
                                                zIndex: 0,
                                                border: '2px solid rgba(52, 211, 153, 0.6)',
                                                animation: 'neon-pulse-border 4s ease-in-out infinite',
                                                animationDelay: '2s',
                                                willChange: 'opacity, box-shadow, border-color',
                                            }}
                                        />
                                    )}

                                    {/* Внешнее размытое свечение для BORDER */}
                                    {active && (
                                        <span
                                            className="pointer-events-none absolute -inset-[2px] rounded-2xl bg-emerald-400/15 blur-sm"
                                            style={{
                                                zIndex: -1,
                                                animation: 'neon-pulse-border 4s ease-in-out infinite',
                                                animationDelay: '2s',
                                                willChange: 'opacity',
                                            }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col pt-[112px] lg:pl-[320px] xl:pl-[340px]">
                    <main className="flex-1 p-6 md:p-8">
                        <Outlet />
                    </main>
                </div>
            </div>
        </>
    );
};
export default AdminLayout;
