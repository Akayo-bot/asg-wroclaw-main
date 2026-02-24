import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import LoadingScreen from '@/components/LoadingScreen';
import AdminCard from '@/components/admin/AdminCard';
import { KpiTileSoft } from '@/components/admin/KpiTileSoft';
import MiniAreaChart from '@/components/widgets/MiniStats';
import { useDailyStats } from '@/hooks/useDailyStats';
import {
    Download,
    Users,
    FileText,
    Image,
    Calendar,
    Trophy,
    Eye,
    UserCheck,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    ChevronDown,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/* ——————————————————————————————————————————
   Types
—————————————————————————————————————————— */

interface Stats {
    total_articles: number;
    published_articles: number;
    draft_articles: number;
    total_events: number;
    upcoming_events: number;
    completed_events: number;
    cancelled_events: number;
    total_users: number;
    admin_users: number;
    editor_users: number;
    regular_users: number;
    total_registrations: number;
    gallery_items: number;
    team_members: number;
}

interface TopArticle {
    id: string;
    title_uk: string;
    title_ru: string;
    title_pl: string;
    views_count: number;
}

interface TopEvent {
    id: string;
    title_uk: string;
    title_ru: string;
    title_pl: string;
    registration_count: number;
}

interface GrowthData {
    users: number | null;
    articles: number | null;
    events: number | null;
}

type PeriodKey = '7d' | '30d' | 'year' | 'all';

const PERIOD_OPTIONS: { key: PeriodKey; label: string; days: number }[] = [
    { key: '7d', label: 'Останні 7 днів', days: 7 },
    { key: '30d', label: 'Останні 30 днів', days: 30 },
    { key: 'year', label: 'Цей рік', days: 365 },
    { key: 'all', label: 'За весь час', days: 0 },
];

/* ——————————————————————————————————————————
   Component
—————————————————————————————————————————— */

const StatsManager = () => {
    const { t, language } = useI18n();
    const { toast } = useToast();
    const [stats, setStats] = useState<Stats | null>(null);
    const [topArticles, setTopArticles] = useState<TopArticle[]>([]);
    const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [growth, setGrowth] = useState<GrowthData>({ users: null, articles: null, events: null });

    // Period filter
    const [period, setPeriod] = useState<PeriodKey>('7d');
    const [periodOpen, setPeriodOpen] = useState(false);

    const currentPeriod = PERIOD_OPTIONS.find(p => p.key === period)!;
    const chartDays = currentPeriod.days || 365; // "all" defaults to 365 for chart display

    // Chart data with configurable period
    const { data: usersChart, isLoading: loadingUsers } = useDailyStats('profiles', 'created_at', chartDays);
    const { data: articlesChart, isLoading: loadingArticles } = useDailyStats('articles', 'created_at', chartDays);

    useEffect(() => {
        fetchStats();
        fetchTopContent();
    }, []);

    useEffect(() => {
        fetchGrowth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period]);

    const fetchStats = async () => {
        try {
            const { data, error } = await supabase.rpc('get_admin_stats');
            if (error) throw error;

            const rpcStats = data as unknown as Stats;

            // Count cancelled events directly (RPC doesn't include them)
            const [{ count: cancelledCount }, { count: completedCount }, { count: upcomingCount }] = await Promise.all([
                supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
                supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
                supabase.from('events').select('id', { count: 'exact', head: true }).in('status', ['upcoming', 'registration_open', 'registration_closed']),
            ]);

            setStats({
                ...rpcStats,
                cancelled_events: cancelledCount ?? 0,
                completed_events: completedCount ?? 0,
                upcoming_events: upcomingCount ?? 0,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            toast({
                title: t('common.error', 'Error'),
                description: t('stats.fetch_error', 'Failed to fetch statistics'),
                variant: 'destructive',
            });
        }
    };

    const fetchTopContent = async () => {
        try {
            const { data: articlesData, error: articlesError } = await supabase
                .from('articles')
                .select('id, title_uk, title_ru, title_pl, views_count')
                .eq('status', 'published')
                .order('views_count', { ascending: false })
                .limit(5);

            if (articlesError) throw articlesError;
            setTopArticles(articlesData || []);

            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select(`id, title_uk, title_ru, title_pl, event_registrations(count)`)
                .order('created_at', { ascending: false })
                .limit(5);

            if (eventsError) throw eventsError;

            const eventsWithCounts = (eventsData || []).map(event => ({
                id: event.id,
                title_uk: event.title_uk,
                title_ru: event.title_ru,
                title_pl: event.title_pl,
                registration_count: (event as Record<string, unknown>).event_registrations
                    ? ((event as Record<string, unknown>).event_registrations as unknown[]).length
                    : 0,
            }));

            setTopEvents(eventsWithCounts);
        } catch (error) {
            console.error('Error fetching top content:', error);
        } finally {
            setLoading(false);
        }
    };

    /* ---------- Growth % calculation based on period ---------- */
    const fetchGrowth = useCallback(async () => {
        const now = new Date();
        let currentStart: string;
        let prevStart: string;
        let prevEnd: string;

        switch (period) {
            case '7d': {
                const cs = new Date(now.getTime() - 7 * 86400000);
                const ps = new Date(now.getTime() - 14 * 86400000);
                currentStart = cs.toISOString();
                prevStart = ps.toISOString();
                prevEnd = cs.toISOString();
                break;
            }
            case '30d': {
                const cs = new Date(now.getTime() - 30 * 86400000);
                const ps = new Date(now.getTime() - 60 * 86400000);
                currentStart = cs.toISOString();
                prevStart = ps.toISOString();
                prevEnd = cs.toISOString();
                break;
            }
            case 'year': {
                const yearStart = new Date(now.getFullYear(), 0, 1);
                const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
                const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
                currentStart = yearStart.toISOString();
                prevStart = lastYearStart.toISOString();
                prevEnd = lastYearEnd.toISOString();
                break;
            }
            default: {
                // "all" — no growth comparison
                setGrowth({ users: null, articles: null, events: null });
                return;
            }
        }

        try {
            const [
                { count: usersCurr }, { count: usersPrev },
                { count: articlesCurr }, { count: articlesPrev },
                { count: eventsCurr }, { count: eventsPrev },
            ] = await Promise.all([
                supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', currentStart),
                supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', prevStart).lte('created_at', prevEnd),
                supabase.from('articles').select('id', { count: 'exact', head: true }).gte('created_at', currentStart),
                supabase.from('articles').select('id', { count: 'exact', head: true }).gte('created_at', prevStart).lte('created_at', prevEnd),
                supabase.from('events').select('id', { count: 'exact', head: true }).gte('created_at', currentStart),
                supabase.from('events').select('id', { count: 'exact', head: true }).gte('created_at', prevStart).lte('created_at', prevEnd),
            ]);

            const calcGrowth = (current: number | null, prev: number | null): number | null => {
                if (prev === null || prev === 0) return current && current > 0 ? 100 : 0;
                if (current === null) return 0;
                return Math.round(((current - prev) / prev) * 100);
            };

            setGrowth({
                users: calcGrowth(usersCurr, usersPrev),
                articles: calcGrowth(articlesCurr, articlesPrev),
                events: calcGrowth(eventsCurr, eventsPrev),
            });
        } catch (error) {
            console.error('Error fetching growth:', error);
        }
    }, [period]);

    /* ---------- CSV Export ---------- */
    const handleExport = () => {
        if (!stats) return;

        const csvData = [
            ['Metric', 'Value'],
            ['Total Articles', stats.total_articles],
            ['Published Articles', stats.published_articles],
            ['Draft Articles', stats.draft_articles],
            ['Total Events', stats.total_events],
            ['Upcoming Events', stats.upcoming_events],
            ['Completed Events', stats.completed_events],
            ['Cancelled Events', stats.cancelled_events],
            ['Total Users', stats.total_users],
            ['Admin Users', stats.admin_users],
            ['Editor Users', stats.editor_users],
            ['Regular Users', stats.regular_users],
            ['Total Registrations', stats.total_registrations],
            ['Gallery Items', stats.gallery_items],
            ['Team Members', stats.team_members],
        ];

        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `stats_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: t('common.success', 'Success'),
            description: t('stats.exported', 'Statistics exported successfully'),
        });
    };

    /* ---------- Helpers ---------- */
    const getTitle = (item: TopArticle | TopEvent) => {
        const titles: Record<string, string> = {
            uk: item.title_uk,
            ru: item.title_ru,
            pl: item.title_pl,
            en: item.title_uk,
        };
        return titles[language] || item.title_uk;
    };

    const renderGrowthBadge = (value: number | null) => {
        if (value === null) return null;
        const isPositive = value >= 0;
        return (
            <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {isPositive ? '+' : ''}{value}%
            </span>
        );
    };

    const chartLabel = currentPeriod.key === 'all' ? '(рік)' : `(${currentPeriod.label.toLowerCase()})`;

    if (loading) {
        return <LoadingScreen label="SCANNING TARGETS…" size={140} />;
    }

    if (!stats) {
        return (
            <div className="text-center py-8">
                <p className="text-neutral-400">{t('stats.no_data', 'No statistics available')}</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1400px] xl:max-w-[1500px] space-y-6 lg:space-y-8">

            {/* Header + Period Filter + Export */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-[#46D6C8]">
                        {t('stats.title', 'Статистика & Аналітика')}
                    </h1>
                    <p className="text-sm text-neutral-400 mt-0.5">
                        {t('stats.description', 'Огляд продуктивності та контенту сайту')}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Period Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setPeriodOpen(prev => !prev)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 text-sm text-neutral-200 transition-all duration-200"
                            aria-label="Обрати період"
                            aria-expanded={periodOpen}
                            tabIndex={0}
                        >
                            {currentPeriod.label}
                            <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${periodOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {periodOpen && (
                            <>
                                {/* Invisible backdrop to close dropdown */}
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setPeriodOpen(false)}
                                    onKeyDown={(e) => { if (e.key === 'Escape') setPeriodOpen(false); }}
                                    role="button"
                                    tabIndex={-1}
                                    aria-label="Закрити меню"
                                />
                                <div className="absolute right-0 top-full mt-1 z-50 w-48 py-1 rounded-lg bg-[#0a0f0d] border border-white/10 shadow-xl">
                                    {PERIOD_OPTIONS.map(opt => (
                                        <button
                                            key={opt.key}
                                            type="button"
                                            tabIndex={0}
                                            aria-label={opt.label}
                                            onClick={() => { setPeriod(opt.key); setPeriodOpen(false); }}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setPeriod(opt.key); setPeriodOpen(false); } }}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                                period === opt.key
                                                    ? 'text-[#46D6C8] bg-[#46D6C8]/10'
                                                    : 'text-neutral-300 hover:bg-white/5'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Export button */}
                    <button
                        type="button"
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#46D6C8]/10 ring-1 ring-[#46D6C8]/30 hover:shadow-[0_0_10px_rgba(70,214,200,0.4)] hover:ring-[#46D6C8]/50 hover:bg-[#46D6C8]/15 active:scale-[0.98] transition-all duration-200 text-sm text-[#46D6C8]"
                        aria-label="Export CSV"
                        tabIndex={0}
                    >
                        <Download className="h-4 w-4" />
                        {t('stats.export', 'Експорт CSV')}
                    </button>
                </div>
            </div>

            {/* ——— Global KPI tiles with growth ——— */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <KpiTileSoft
                    label="Користувачі"
                    value={stats.total_users}
                    sub={
                        <span className="flex items-center gap-2">
                            <span>{stats.admin_users} Admin · {stats.editor_users} Editor · {stats.regular_users} User</span>
                            {renderGrowthBadge(growth.users)}
                        </span>
                    }
                    icon={<Users className="h-4 w-4" />}
                />
                <KpiTileSoft
                    label="Контент"
                    value={stats.total_articles}
                    sub={
                        <span className="flex items-center gap-2">
                            <span>{stats.published_articles} опубл. · {stats.draft_articles} черн.</span>
                            {renderGrowthBadge(growth.articles)}
                        </span>
                    }
                    icon={<FileText className="h-4 w-4" />}
                />
                <KpiTileSoft
                    label="Події"
                    value={stats.total_events}
                    sub={
                        <span className="flex items-center gap-2">
                            <span>{stats.upcoming_events} заплан. · {stats.completed_events} заверш. · {stats.cancelled_events} скас.</span>
                            {renderGrowthBadge(growth.events)}
                        </span>
                    }
                    icon={<Calendar className="h-4 w-4" />}
                />
                <KpiTileSoft
                    label="Реєстрації"
                    value={stats.total_registrations}
                    sub="Усього реєстр. на події"
                    icon={<UserCheck className="h-4 w-4" />}
                />
                <KpiTileSoft
                    label="Галерея"
                    value={stats.gallery_items}
                    sub="Фото у галереї"
                    icon={<Image className="h-4 w-4" />}
                />
                <KpiTileSoft
                    label="Команда"
                    value={stats.team_members}
                    sub="Активних учасників"
                    icon={<Trophy className="h-4 w-4" />}
                />
            </div>

            {/* ——— Trend Charts (period-aware) ——— */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <AdminCard
                    title={`Нові користувачі ${chartLabel}`}
                    icon={<TrendingUp className="h-5 w-5 text-[#46D6C8]/80" />}
                >
                    <div className="h-[200px] -mx-2">
                        <MiniAreaChart
                            title=""
                            data={usersChart}
                            color="#46D6C8"
                            isLoading={loadingUsers}
                        />
                    </div>
                </AdminCard>

                <AdminCard
                    title={`Нові статті ${chartLabel}`}
                    icon={<Eye className="h-5 w-5 text-[#46D6C8]/80" />}
                >
                    <div className="h-[200px] -mx-2">
                        <MiniAreaChart
                            title=""
                            data={articlesChart}
                            color="#8B5CF6"
                            isLoading={loadingArticles}
                        />
                    </div>
                </AdminCard>
            </div>

            {/* ——— Top Content Leaderboards ——— */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Top Articles by Views */}
                <AdminCard
                    title={t('stats.top_articles', 'Топ статей за переглядами')}
                    icon={<Eye className="h-5 w-5 text-[#46D6C8]/80" />}
                >
                    {topArticles.length === 0 ? (
                        <p className="text-sm text-neutral-500 py-4 text-center">
                            Немає даних
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {topArticles.map((article, index) => (
                                <div
                                    key={article.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/60 ring-1 ring-[#46D6C8]/10"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="flex items-center justify-center h-7 w-7 rounded-full bg-[#46D6C8]/10 ring-1 ring-[#46D6C8]/25 text-xs font-bold text-[#46D6C8] shrink-0">
                                            {index + 1}
                                        </span>
                                        <p className="text-sm font-medium text-neutral-200 truncate">
                                            {getTitle(article)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-neutral-400 shrink-0 ml-2">
                                        <Eye className="h-3 w-3" />
                                        <span className="text-[#46D6C8] font-medium">{article.views_count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </AdminCard>

                {/* Top Events by Registrations */}
                <AdminCard
                    title={t('stats.top_events', 'Топ подій за реєстраціями')}
                    icon={<UserCheck className="h-5 w-5 text-[#46D6C8]/80" />}
                >
                    {topEvents.length === 0 ? (
                        <p className="text-sm text-neutral-500 py-4 text-center">
                            Немає даних
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {topEvents.map((event, index) => (
                                <div
                                    key={event.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/60 ring-1 ring-[#46D6C8]/10"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="flex items-center justify-center h-7 w-7 rounded-full bg-[#46D6C8]/10 ring-1 ring-[#46D6C8]/25 text-xs font-bold text-[#46D6C8] shrink-0">
                                            {index + 1}
                                        </span>
                                        <p className="text-sm font-medium text-neutral-200 truncate">
                                            {getTitle(event)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-neutral-400 shrink-0 ml-2">
                                        <UserCheck className="h-3 w-3" />
                                        <span className="text-[#46D6C8] font-medium">{event.registration_count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </AdminCard>
            </div>
        </div>
    );
};

export default StatsManager;