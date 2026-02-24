import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useI18n } from '@/contexts/I18nContext';
import { SearchBarNeon } from '@/components/admin/SearchBarNeon';
import { NeonPopoverList } from '@/components/admin/NeonPopoverList';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LoadingScreen from '@/components/LoadingScreen';
import EventCard from '@/components/events/EventCard';
import { Event as UIEvent, EventStatus } from '@/types/Event';
import { Tables, Database } from '@/integrations/supabase/types';

type DBEvent = Tables<'events'>;

const GamesPage = () => {
    const { t, language } = useI18n();
    const { toast } = useToast();
    const [events, setEvents] = useState<DBEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'open' | 'full' | 'completed' | 'cancelled'>('all');

    useEffect(() => {
        fetchEvents();
    }, [statusFilter]);

    useEffect(() => {
        const checkEventStatuses = async () => {
            if (events.length === 0) return;

            const now = new Date();
            const eventsToUpdate = events.filter(e => {
                if (e.status === 'completed' || e.status === 'cancelled') return false;
                if (e.start_datetime) {
                    return new Date(e.start_datetime) < now;
                }
                return false;
            });

            if (eventsToUpdate.length > 0) {
                await Promise.all(eventsToUpdate.map(event =>
                    supabase
                        .from('events')
                        .update({ status: 'completed' })
                        .eq('id', event.id)
                ));
                fetchEvents();
            }
        };

        checkEventStatuses();
    }, [events.length]);

    const fetchEvents = async () => {
        try {
            let query = supabase.from('events').select('*');

            if (statusFilter !== 'all') {
                if (statusFilter === 'open') {
                    query = query.in('status', ['upcoming', 'registration_open']);
                } else if (statusFilter === 'full') {
                    query = query.eq('status', 'registration_closed');
                } else {
                    query = query.eq('status', statusFilter);
                }
            }

            query = query.order('start_datetime', { ascending: true });

            const { data, error } = await query;
            if (error) throw error;

            const sortedData = (data || []).sort((a, b) => {
                const isActiveA = ['upcoming', 'registration_open', 'registration_closed'].includes(a.status);
                const isActiveB = ['upcoming', 'registration_open', 'registration_closed'].includes(b.status);

                if (isActiveA && !isActiveB) return -1;
                if (!isActiveA && isActiveB) return 1;

                const dateA = new Date(a.start_datetime || a.event_date).getTime();
                const dateB = new Date(b.start_datetime || b.event_date).getTime();

                if (isActiveA && isActiveB) return dateA - dateB;
                return dateB - dateA;
            });

            setEvents(sortedData);
        } catch (error) {
            console.error('Error fetching events:', error);
            toast({
                title: t('common.error', 'Error'),
                description: t('events.fetch_error', 'Failed to fetch events'),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const getTitle = (event: DBEvent) => {
        const titles = {
            uk: event.title_uk,
            ru: event.title_ru,
            pl: event.title_pl,
            en: event.title_en || event.title_uk,
        };
        return titles[language as keyof typeof titles] || event.title_uk;
    };

    const getLocation = (event: DBEvent) => {
        const locations = {
            uk: event.location_uk,
            ru: event.location_ru,
            pl: event.location_pl,
            en: event.location_en || event.location_uk,
        };
        return locations[language as keyof typeof locations] || event.location_uk;
    };

    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            if (!searchTerm) return true;
            const title = getTitle(event).toLowerCase();
            const location = getLocation(event).toLowerCase();
            return title.includes(searchTerm.toLowerCase()) || location.includes(searchTerm.toLowerCase());
        });
    }, [events, searchTerm, language]);

    const mapToUIEvent = (dbEvent: DBEvent): UIEvent => {
        let dateObj = new Date(dbEvent.start_datetime || dbEvent.event_date || new Date());
        if (isNaN(dateObj.getTime())) dateObj = new Date();

        const getLoc = (keyPrefix: string) => {
            const key = `${keyPrefix}_${language}`;
            return (dbEvent as any)[key] || (dbEvent as any)[`${keyPrefix}_uk`] || '';
        };

        const gatheringTime = new Date(dateObj.getTime() - 60 * 60 * 1000).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });
        const startTime = dateObj.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });

        let status: EventStatus = 'Open';
        if (dbEvent.status === 'upcoming') status = 'Announced';
        if (dbEvent.status === 'cancelled') status = 'Canceled';
        if (dbEvent.status === 'completed') status = 'Completed';
        if (dbEvent.status === 'registration_closed') status = 'Full';

        return {
            id: dbEvent.id,
            image_url: dbEvent.main_image_url || 'https://images.unsplash.com/photo-1627916527022-7933930b1b13?q=80&w=2940&auto=format&fit=crop',
            title: getTitle(dbEvent),
            date: dateObj.toLocaleDateString(language),
            location_name: getLocation(dbEvent),
            location_map_url: dbEvent.map_url || '#',
            participant_limit: dbEvent.max_players || 0,
            participants_registered: 0,
            price: dbEvent.price_amount || 0,
            currency: dbEvent.price_currency || 'PLN',
            status,
            gathering_time: gatheringTime,
            start_time: startTime,
            duration: dbEvent.duration || '',
            amenities: (dbEvent as any).amenities || [],
            game_meta: getLoc('scenario'),
            rules_safety: getLoc('rules'),
        };
    };

    if (loading && events.length === 0) {
        return <LoadingScreen label="SCANNING TARGETS…" size={140} />;
    }

    return (
        <Layout>
            <div className="min-h-screen py-12">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="text-center mb-12">
                        <h1 className="font-rajdhani text-4xl md:text-5xl font-bold text-white mb-4">
                            {t('games.title', 'Игры')}
                        </h1>
                        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                            {t('games.subtitle', 'Предстоящие игры и события')}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 max-w-4xl mx-auto mb-6">
                        <div className="flex-1 w-full">
                            <SearchBarNeon
                                value={searchTerm}
                                onChange={setSearchTerm}
                                placeholder={t('games.search_placeholder', 'Поиск событий...')}
                                className="!mb-0"
                            />
                        </div>
                        <div className="shrink-0 self-center">
                            <NeonPopoverList
                                value={statusFilter}
                                onChange={(v) => setStatusFilter(v as any)}
                                options={[
                                    { id: "all", label: t('events.all_statuses', 'Все статусы'), textColor: "text-neutral-300", hoverColor: "teal" },
                                    { id: "upcoming", label: t('events.status.announced', 'Анонс'), textColor: "text-blue-400", hoverColor: "blue" },
                                    { id: "open", label: t('events.status.open', 'Открыт набор'), textColor: "text-emerald-400", hoverColor: "emerald" },
                                    { id: "full", label: t('events.status.full', 'Мест нет'), textColor: "text-amber-400", hoverColor: "amber" },
                                    { id: "completed", label: t('events.status.completed', 'Завершено'), textColor: "text-slate-400", hoverColor: "teal" },
                                    { id: "cancelled", label: t('events.status.cancelled', 'Отменено'), textColor: "text-rose-400", hoverColor: "rose" },
                                ]}
                                color="teal"
                                minW={180}
                            />
                        </div>
                    </div>

                    <div className="mx-auto max-w-[1400px] py-4 sm:py-6 mt-4 sm:mt-6 relative">
                        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(70,214,200,.08),transparent_70%)] opacity-50 rounded-2xl" />

                        {filteredEvents.length === 0 ? (
                            <section className="relative rounded-2xl p-6 md:p-7 border border-[#46D6C8]/20 bg-[#04070A]/80 backdrop-blur-sm">
                                <span className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_70%_at_50%_0%,rgba(70,214,200,.12),transparent_60%)]" />
                                <h3 className="text-center text-slate-200 font-medium">{t('games.no_games', 'Событий не найдено')}</h3>
                                <p className="text-center text-slate-400 mt-1">{t('games.try_change_filters', 'Попробуйте изменить фильтры...')}</p>
                            </section>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredEvents.map((dbEvent) => (
                                    <EventCard
                                        key={`${dbEvent.id}-${dbEvent.status}`}
                                        event={mapToUIEvent(dbEvent)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default GamesPage;
