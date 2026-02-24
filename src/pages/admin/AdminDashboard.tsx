import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import {
    Users,
    CalendarDays,
    Plus,
    Target,
    UserPlus,
    Palette,
    Clock,
    Database,
    Archive,
    MapPin,
    Crosshair,
} from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';
import { ActivityFeed } from '@/components/widgets/ActivityFeed';

/* ——————————————————————————————————————————
   Types
—————————————————————————————————————————— */

interface PulseData {
    newToday: number;
    newThisWeek: number;
    activeEvents: number;
}

interface UpcomingEvent {
    id: string;
    title: string;
    start_datetime: string;
    max_players: number | null;
    registrations: number;
    daysUntil: number;
    status: string;
}

/* ——————————————————————————————————————————
   Component
—————————————————————————————————————————— */

const AdminDashboard = () => {
    const { language } = useI18n();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [pulse, setPulse] = useState<PulseData>({ newToday: 0, newThisWeek: 0, activeEvents: 0 });
    const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch all dashboard data on mount
    useEffect(() => {
        const init = async () => {
            try {
                await Promise.all([fetchPulse(), fetchUpcomingEvents()]);
            } catch (err) {
                console.error('Dashboard fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ---------- System Pulse ---------- */
    const fetchPulse = async () => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [{ count: todayCount }, { count: weekCount }, { count: activeCount }] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
            supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
            supabase.from('events').select('id', { count: 'exact', head: true }).in('status', ['upcoming', 'registration_open', 'registration_closed']),
        ]);

        setPulse({
            newToday: todayCount ?? 0,
            newThisWeek: weekCount ?? 0,
            activeEvents: activeCount ?? 0,
        });
    };

    /* ---------- Upcoming Events ---------- */
    const fetchUpcomingEvents = async () => {
        const now = new Date();

        const { data: eventsData } = await supabase
            .from('events')
            .select('id, title_uk, title_ru, title_pl, title_en, start_datetime, max_players, status')
            .in('status', ['upcoming', 'registration_open', 'registration_closed'])
            .order('start_datetime', { ascending: true })
            .limit(8);

        if (!eventsData || eventsData.length === 0) {
            setUpcomingEvents([]);
            return;
        }

        // Registration counts
        const eventIds = eventsData.map(e => e.id);
        const { data: regData } = await supabase
            .from('event_registrations')
            .select('event_id')
            .in('event_id', eventIds);

        const regMap: Record<string, number> = {};
        regData?.forEach((r: { event_id: string }) => {
            regMap[r.event_id] = (regMap[r.event_id] || 0) + 1;
        });

        const getTitleForLang = (e: typeof eventsData[0]) => {
            const titles: Record<string, string> = {
                uk: e.title_uk,
                ru: e.title_ru,
                pl: e.title_pl,
                en: e.title_en || e.title_uk,
            };
            return titles[language] || e.title_uk;
        };

        const mapped: UpcomingEvent[] = eventsData
            .filter(e => e.start_datetime)
            .map(e => {
                const eventDate = new Date(e.start_datetime!);
                const diffMs = eventDate.getTime() - now.getTime();
                const daysUntil = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                return {
                    id: e.id,
                    title: getTitleForLang(e),
                    start_datetime: e.start_datetime!,
                    max_players: e.max_players,
                    registrations: regMap[e.id] || 0,
                    daysUntil,
                    status: e.status,
                };
            });

        setUpcomingEvents(mapped);
    };

    /* ---------- Helpers ---------- */
    const formatCountdown = (days: number): string => {
        if (days === 0) return 'Сьогодні!';
        if (days === 1) return 'Завтра';
        return `через ${days} ${days < 5 ? 'дні' : 'днів'}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'registration_open': return 'text-emerald-400';
            case 'registration_closed': return 'text-amber-400';
            default: return 'text-blue-400';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'registration_open': return 'Набір відкрито';
            case 'registration_closed': return 'Місць немає';
            default: return 'Анонс';
        }
    };

    if (loading) {
        return <LoadingScreen label="SCANNING TARGETS…" size={140} />;
    }

    return (
        <div className="space-y-4 max-w-7xl mx-auto">

            {/* ═══════════════════════════════════════════ */}
            {/*  1. STATUS BAR                              */}
            {/* ═══════════════════════════════════════════ */}
            <div className="flex flex-wrap items-center justify-between bg-[#04070A] border border-white/10 rounded-lg px-5 py-3 text-sm font-mono">
                <div className="flex items-center gap-5">
                    <span className="inline-flex items-center gap-2 text-green-500">
                        <span className="relative flex h-3 w-3 items-center justify-center shrink-0">
                            <span className="absolute h-2 w-2 rounded-full bg-green-500 animate-ping opacity-75" />
                            <span className="relative h-2 w-2 rounded-full bg-green-500" />
                        </span>
                        Online
                    </span>
                    <span className="flex items-center gap-2 text-blue-400">
                        <Clock className="h-4 w-4" />
                        {currentTime.toLocaleTimeString('uk-UA')}
                    </span>
                </div>
                <div className="flex items-center gap-5">
                    <span className="flex items-center gap-2 text-yellow-500">
                        <Database className="h-4 w-4" />
                        База даних активна
                    </span>
                    <span className="hidden sm:flex items-center gap-2 text-yellow-500">
                        <Archive className="h-4 w-4" />
                        Бекап: Авто
                    </span>
                </div>
            </div>

            {/* ═══════════════════════════════════════════ */}
            {/*  2. QUICK ACTIONS                           */}
            {/* ═══════════════════════════════════════════ */}
            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={() => navigate('/admin/articles/new')}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-all duration-200 flex items-center gap-2 active:scale-[0.97]"
                    aria-label="Створити статтю"
                    tabIndex={0}
                >
                    <Plus className="h-4 w-4" /> Створити статтю
                </button>
                <button
                    type="button"
                    onClick={() => navigate('/admin/events')}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-all duration-200 flex items-center gap-2 active:scale-[0.97]"
                    aria-label="Додати подію"
                    tabIndex={0}
                >
                    <Target className="h-4 w-4" /> Додати подію
                </button>
                <button
                    type="button"
                    onClick={() => navigate('/admin/branding')}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-all duration-200 flex items-center gap-2 active:scale-[0.97]"
                    aria-label="Відкрити бренд-панель"
                    tabIndex={0}
                >
                    <Palette className="h-4 w-4" /> Бренд-панель
                </button>
            </div>

            {/* ═══════════════════════════════════════════ */}
            {/*  3. SYSTEM PULSE  (3 mini-cards)            */}
            {/* ═══════════════════════════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#04070A] border border-white/10 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-[#46D6C8]/10 text-[#46D6C8] rounded-lg">
                        <UserPlus className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Нових сьогодні</p>
                        <p className="text-xl font-bold text-white">+{pulse.newToday}</p>
                    </div>
                </div>

                <div className="bg-[#04070A] border border-white/10 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                        <Users className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Нових за тиждень</p>
                        <p className="text-xl font-bold text-white">+{pulse.newThisWeek}</p>
                    </div>
                </div>

                <div className="bg-[#04070A] border border-white/10 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-lg">
                        <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Активних подій</p>
                        <p className="text-xl font-bold text-white">{pulse.activeEvents}</p>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════ */}
            {/*  4. MAIN GRID  (2/3 events + 1/3 log)      */}
            {/* ═══════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ——— LEFT: Upcoming Events ——— */}
                <div>
                    <div className="bg-[#04070A] border border-white/10 rounded-xl flex flex-col min-h-[360px]">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                            <Crosshair className="h-[18px] w-[18px] text-[#46D6C8]" />
                            <h3 className="font-bold text-white text-sm">Найближчі події</h3>
                        </div>

                        {/* Content */}
                        {upcomingEvents.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-gray-500">
                                <Crosshair className="h-10 w-10 mb-3 opacity-20" />
                                <p className="text-sm">Немає запланованих подій</p>
                            </div>
                        ) : (
                            <div className="p-3 space-y-2">
                                {upcomingEvents.map(event => (
                                    <button
                                        key={event.id}
                                        type="button"
                                        tabIndex={0}
                                        aria-label={`Подія: ${event.title}`}
                                        onClick={() => navigate('/admin/events')}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/admin/events'); }}
                                        className="w-full text-left rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 p-3 transition-all duration-200"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {event.title}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1 text-xs">
                                                    <span className="text-[#46D6C8]">
                                                        {formatCountdown(event.daysUntil)}
                                                    </span>
                                                    <span className="text-gray-600">•</span>
                                                    <span className={getStatusColor(event.status)}>
                                                        {getStatusLabel(event.status)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Users className="h-3.5 w-3.5 text-gray-500" />
                                                    <span className="text-[#46D6C8] font-medium">{event.registrations}</span>
                                                    {event.max_players && (
                                                        <span className="text-gray-600">/{event.max_players}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                                                    <MapPin className="h-3 w-3" />
                                                    {new Date(event.start_datetime).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Registration progress bar */}
                                        {event.max_players && event.max_players > 0 && (
                                            <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-[#46D6C8] to-emerald-400 transition-all duration-500"
                                                    style={{ width: `${Math.min(100, (event.registrations / event.max_players) * 100)}%` }}
                                                />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ——— RIGHT: Activity Feed ——— */}
                <div>
                    <ActivityFeed />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;