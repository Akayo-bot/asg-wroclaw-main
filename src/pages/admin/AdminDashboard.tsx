import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
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
    Circle,
    Dot,
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
import MiniAreaChart from '@/components/widgets/MiniStats';
import CalendarPro from '@/components/widgets/CalendarPro';
import { ActivityFeed } from '@/components/widgets/ActivityFeed';
import { Notifications } from '@/components/widgets/Notifications';
import { useDailyStats } from '@/hooks/useDailyStats';

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
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    // 🔥 Отримуємо дані про користувачів за останні 7 днів
    const { data: users7d, isLoading: loadingUsers } = useDailyStats('profiles', 'created_at');
    
    // 🔥 Отримуємо дані про статті за останні 7 днів (використовуємо created_at, оскільки не всі статті опубліковані)
    const { data: posts7d, isLoading: loadingArticles } = useDailyStats('articles', 'created_at');


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

    // Обновляем данные графиков при возврате на страницу (когда страница становится видимой)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Данные обновятся автоматически через хук useDailyStats
                // Можно добавить принудительное обновление, если нужно
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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
                <div className="flex flex-wrap items-center gap-4 text-sm text-[#46D6C8]/80 bg-[#46D6C8]/5 rounded-lg px-4 py-2.5 ring-1 ring-[#46D6C8]/20 animate-fade-in">
                    <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 rounded-full bg-green-500 shrink-0 status-online-dot" />
                        <span className="text-green-500">Online</span>
                    </span>
                    <span className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-blue-600">{currentTime.toLocaleTimeString('uk-UA')}</span>
                    </span>
                    <span className="flex items-center gap-2">
                        <Database className="h-3.5 w-3.5 text-yellow-400" />
                        <span className="text-yellow-400">База даних активна</span>
                    </span>
                    <span className="flex items-center gap-2">
                        <Archive className="h-3.5 w-3.5 text-yellow-400" />
                        <span className="text-yellow-400">Бекап: Автоматично</span>
                    </span>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3 pointer-events-auto">
                    <button
                        onClick={() => navigate('/admin/articles/new')}
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#46D6C8]/10 ring-1 ring-[#46D6C8]/30 hover:shadow-[0_0_10px_rgba(70,214,200,0.4)] hover:ring-[#46D6C8]/50 hover:bg-[#46D6C8]/15 active:scale-[0.98] transition-all duration-200 cursor-target pointer-events-auto touch-auto"
                    >
                        <Plus className="h-4 w-4" />
                        Створити статтю
                    </button>
                    <button
                        onClick={() => navigate('/admin/events')}
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#46D6C8]/10 ring-1 ring-[#46D6C8]/30 hover:shadow-[0_0_10px_rgba(70,214,200,0.4)] hover:ring-[#46D6C8]/50 hover:bg-[#46D6C8]/15 active:scale-[0.98] transition-all duration-200 cursor-target pointer-events-auto touch-auto"
                    >
                        <Target className="h-4 w-4" />
                        Додати подію
                    </button>
                    <button
                        onClick={() => navigate('/admin/branding')}
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#46D6C8]/10 ring-1 ring-[#46D6C8]/30 hover:shadow-[0_0_10px_rgba(70,214,200,0.4)] hover:ring-[#46D6C8]/50 hover:bg-[#46D6C8]/15 active:scale-[0.98] transition-all duration-200 cursor-target pointer-events-auto touch-auto"
                    >
                        <Palette className="h-4 w-4" />
                        Відкрити бренд-панель
                    </button>
                </div>

                {/* Admin Insights */}
                <div className="flex flex-wrap gap-4 text-sm text-[#46D6C8]/90">
                    <div className="bg-[#0b110f]/80 px-4 py-2 rounded-lg ring-1 ring-[#46D6C8]/15">
                        👥 Нових користувачів: <span className="text-[#46D6C8]">{stats.total_registrations}</span>
                    </div>
                    <div className="bg-[#0b110f]/80 px-4 py-2 rounded-lg ring-1 ring-[#46D6C8]/15">
                        🧾 Оновлено статей: <span className="text-[#46D6C8]">{stats.published_articles}</span>
                    </div>
                    <div className="bg-[#0b110f]/80 px-4 py-2 rounded-lg ring-1 ring-[#46D6C8]/15">
                        📅 Активних подій: <span className="text-[#46D6C8]">{stats.upcoming_events}</span>
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
                    <AdminCard title={t('admin.roles.title', 'Управління ролями')} icon={<Shield className="h-5 w-5 text-[#46D6C8]/80" />}>
                        <p className="text-sm text-neutral-400">{t('admin.roles.description', 'Призначення ролей користувачам')}</p>
                        <CommandButtonSoft
                            icon={<Shield className="h-4 w-4 text-[#46D6C8]/80" />}
                            label={t('admin.openRoleManager', 'Відкрити менеджер ролей')}
                            onClick={() => navigate('/admin/roles')}
                        />
                    </AdminCard>

                    {/* Управління брендом доступне тільки для SuperAdmin */}
                    {profile?.role === 'superadmin' && (
                        <AdminCard title={t('admin.branding.title', 'Управління брендом')} icon={<Palette className="h-5 w-5 text-[#46D6C8]/80" />}>
                            <p className="text-sm text-neutral-400">
                                {t('admin.branding.description', 'Налаштування бренду та зовнішнього вигляду')}
                            </p>
                            <CommandButtonSoft
                                icon={<PenSquare className="h-4 w-4 text-[#46D6C8]/80" />}
                                label={t('admin.openBrandPanel', 'Відкрити бренд-панель')}
                                onClick={() => navigate('/admin/branding')}
                            />
                        </AdminCard>
                    )}
                </div>

                {/* Widgets Section */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-5">
                    <div className="sm:col-span-3 lg:col-span-2">
                        <MiniAreaChart title="Нові користувачі (7д)" data={users7d} color="#46D6C8" isLoading={loadingUsers} />
                    </div>
                    <div className="sm:col-span-3 lg:col-span-2">
                        <MiniAreaChart title="Статті (7д)" data={posts7d} color="#46D6C8" isLoading={loadingArticles} />
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
                            <ActivityFeed />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;