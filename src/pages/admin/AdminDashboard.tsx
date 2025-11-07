import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    FileText,
    Users,
    CalendarDays,
    Calendar,
    Images,
    TrendingUp,
    UserCheck,
    Image as Img,
    Shield,
    PenSquare,
    Palette,
    LineChart,
    CircleDot,
    Database,
    Clock,
    Archive,
    Plus,
    Target
} from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';
import AdminCard from '@/components/admin/AdminCard';
import { KpiTileSoft } from '@/components/admin/KpiTileSoft';
import { CommandButtonSoft } from '@/components/admin/CommandButtonSoft';
import { InfoRow } from '@/components/admin/InfoRow';
import { MiniStats } from '@/components/widgets/MiniStats';
import CalendarPro from '@/components/widgets/CalendarPro';
import { ActivityFeed } from '@/components/widgets/ActivityFeed';
import { Notifications } from '@/components/widgets/Notifications';

interface AdminStats {
    total_articles: number;
    published_articles: number;
    draft_articles: number;
    total_events: number;
    upcoming_events: number;
    completed_events: number;
    total_users: number;
    admin_users: number;
    editor_users: number;
    regular_users: number;
    total_registrations: number;
    gallery_items: number;
    team_members: number;
}

const AdminDashboard = () => {
    const { t } = useI18n();
    const navigate = useNavigate();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Sample data for widgets
    const users7d = [
        { x: "Пн", y: 1 }, { x: "Вт", y: 0 }, { x: "Ср", y: 2 }, { x: "Чт", y: 1 }, { x: "Пт", y: 0 }, { x: "Сб", y: 1 }, { x: "Нд", y: 0 }
    ];
    const posts7d = [{ x: "Пн", y: 0 }, { x: "Вт", y: 1 }, { x: "Ср", y: 0 }, { x: "Чт", y: 0 }, { x: "Пт", y: 0 }, { x: "Сб", y: 0 }, { x: "Нд", y: 0 }];

    const feedItems = [
        { id: "1", actor: "Akayo", action: "created" as const, target: "статтю «ASG Wrocław Game»", ts: new Date().toISOString() },
        { id: "2", actor: "Akayo", action: "role_changed" as const, target: "користувача «Марвин» → Editor", ts: new Date(Date.now() - 3600e3).toISOString() },
    ];

    const notificationItems = [
        { id: "1", title: "Заплановано подію на 03.11", ts: new Date().toISOString(), unread: true },
        { id: "2", title: "Нове зображення в Галереї", ts: new Date(Date.now() - 7200e3).toISOString() }
    ];

    const calendarEvents = [
        { date: "2025-11-03", title: "ASG Wrocław", kind: "game" as const },
        { date: "2025-11-10", title: "Training", kind: "training" as const },
        { date: "2025-11-10", title: "Briefing", kind: "meeting" as const },
    ];

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data, error } = await supabase.rpc('get_admin_stats');
                if (error) throw error;
                if (data && typeof data === 'object') {
                    setStats(data as unknown as AdminStats);
                }
            } catch (error) {
                console.error('Error fetching admin stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return <LoadingScreen label="SCANNING TARGETS…" size={140} />;
    }

    if (!stats) {
        return <div className="text-center py-8 text-destructive">{t('common.error', 'Error')}</div>;
    }

    return (
        <div className="mx-auto max-w-[1400px] xl:max-w-[1500px] px-5 xl:px-8 py-6 bg-[var(--adm-bg)] min-h-screen">
            <main
                id="app-main"
                className="relative z-[40] space-y-6 lg:space-y-8 pointer-events-auto touch-auto isolate"
            >
                {/* System Status Bar */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-emerald-300/80 bg-emerald-500/5 rounded-lg px-4 py-2.5 ring-1 ring-emerald-400/20 animate-fade-in">
                    <span className="flex items-center gap-2">
                        <CircleDot className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                        Online
                    </span>
                    <span className="flex items-center gap-2">
                        <Database className="h-3.5 w-3.5 text-emerald-400" />
                        База даних активна
                    </span>
                    <span className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-emerald-400" />
                        {currentTime.toLocaleTimeString('uk-UA')}
                    </span>
                    <span className="flex items-center gap-2">
                        <Archive className="h-3.5 w-3.5 text-yellow-400" />
                        Бекап: Автоматично
                    </span>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3 pointer-events-auto">
                    <button
                        onClick={() => navigate('/admin/articles?action=create')}
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-400/30 hover:shadow-[0_0_10px_#00ff8840] hover:ring-emerald-300/50 hover:bg-emerald-500/15 active:scale-[0.98] transition-all duration-200 cursor-target pointer-events-auto touch-auto"
                    >
                        <Plus className="h-4 w-4" />
                        Створити статтю
                    </button>
                    <button
                        onClick={() => navigate('/admin/events?action=create')}
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-400/30 hover:shadow-[0_0_10px_#00ff8840] hover:ring-emerald-300/50 hover:bg-emerald-500/15 active:scale-[0.98] transition-all duration-200 cursor-target pointer-events-auto touch-auto"
                    >
                        <Target className="h-4 w-4" />
                        Додати подію
                    </button>
                    <button
                        onClick={() => navigate('/admin/branding')}
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-400/30 hover:shadow-[0_0_10px_#00ff8840] hover:ring-emerald-300/50 hover:bg-emerald-500/15 active:scale-[0.98] transition-all duration-200 cursor-target pointer-events-auto touch-auto"
                    >
                        <Palette className="h-4 w-4" />
                        Відкрити бренд-панель
                    </button>
                </div>

                {/* Admin Insights */}
                <div className="flex flex-wrap gap-4 text-sm text-emerald-300/90">
                    <div className="bg-[#0b110f]/80 px-4 py-2 rounded-lg ring-1 ring-emerald-400/15">
                        👥 Нових користувачів: <span className="text-emerald-200">{stats.total_registrations}</span>
                    </div>
                    <div className="bg-[#0b110f]/80 px-4 py-2 rounded-lg ring-1 ring-emerald-400/15">
                        🧾 Оновлено статей: <span className="text-emerald-200">{stats.published_articles}</span>
                    </div>
                    <div className="bg-[#0b110f]/80 px-4 py-2 rounded-lg ring-1 ring-emerald-400/15">
                        📅 Активних подій: <span className="text-emerald-200">{stats.upcoming_events}</span>
                    </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                    <KpiTileSoft
                        label={t('admin.totalArticles', 'Всього статей')}
                        value={stats.total_articles}
                        sub={`${stats.published_articles} опубліковано, ${stats.draft_articles} чернеток`}
                        icon={<FileText className="h-4 w-4" />}
                    />
                    <KpiTileSoft
                        label={t('admin.totalUsers', 'Користувачі')}
                        value={stats.total_users}
                        sub={`${stats.admin_users} адміністраторів, ${stats.editor_users} редакторів`}
                        icon={<Users className="h-4 w-4" />}
                    />
                    <KpiTileSoft
                        label={t('admin.totalEvents', 'Подій')}
                        value={stats.total_events}
                        sub={`${stats.upcoming_events} майбутніх, ${stats.completed_events} завершено`}
                        icon={<CalendarDays className="h-4 w-4" />}
                    />
                    <KpiTileSoft
                        label={t('admin.galleryItems', 'Галерея')}
                        value={stats.gallery_items}
                        sub="фото та відео"
                        icon={<Img className="h-4 w-4" />}
                    />
                </div>

                {/* Блоки */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <AdminCard title={t('admin.roles.title', 'Управління ролями')} icon={<Shield className="h-5 w-5 text-emerald-300/80" />}>
                        <p className="text-sm text-neutral-400">{t('admin.roles.description', 'Призначення ролей користувачам')}</p>
                        <CommandButtonSoft
                            icon={<Shield className="h-4 w-4 text-emerald-300/80" />}
                            label={t('admin.openRoleManager', 'Відкрити менеджер ролей')}
                            onClick={() => navigate('/admin/roles')}
                        />
                    </AdminCard>

                    <AdminCard title={t('admin.branding.title', 'Управління брендом')} icon={<Palette className="h-5 w-5 text-emerald-300/80" />}>
                        <p className="text-sm text-neutral-400">
                            {t('admin.branding.description', 'Налаштування бренду та зовнішнього вигляду')}
                        </p>
                        <CommandButtonSoft
                            icon={<PenSquare className="h-4 w-4 text-emerald-300/80" />}
                            label={t('admin.openBrandPanel', 'Відкрити бренд-панель')}
                            onClick={() => navigate('/admin/branding')}
                        />
                    </AdminCard>
                </div>

                {/* Widgets Section */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-5 items-stretch">
                    <div className="sm:col-span-3 lg:col-span-2">
                        <MiniStats title="Нові користувачі (7д)" data={users7d} />
                    </div>
                    <div className="sm:col-span-3 lg:col-span-2">
                        <MiniStats title="Статті (7д)" data={posts7d} />
                    </div>
                    <div
                        className="sm:col-span-3 lg:col-span-3 flex"
                    >
                        <div className="relative z-20 w-full touch-auto transform-gpu">
                            <CalendarPro events={calendarEvents} onSelect={(iso, evs) => console.log("Date selected:", iso, evs)} />
                        </div>
                    </div>
                    <div
                        className="sm:col-span-3 lg:col-span-5 flex"
                    >
                        <div className="relative z-20 w-full touch-auto transform-gpu">
                            <ActivityFeed items={feedItems} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;