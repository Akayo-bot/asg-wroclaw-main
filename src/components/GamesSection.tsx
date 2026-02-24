import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Link } from 'react-router-dom';
import EventCard from '@/components/events/EventCard';
import { Event as UIEvent, EventStatus } from '@/types/Event';

type DBEvent = Tables<'events'>;

const GamesSection = () => {
    const { t, language } = useI18n();
    const [upcomingGames, setUpcomingGames] = useState<DBEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUpcomingGames();
    }, []);

    const fetchUpcomingGames = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .in('status', ['upcoming', 'registration_open'])
                .gte('start_datetime', new Date().toISOString())
                .order('start_datetime', { ascending: true })
                .limit(3);

            if (error) {
                console.error('Error fetching upcoming games:', error);
                return;
            }

            setUpcomingGames(data || []);
        } catch (error) {
            console.error('Error fetching upcoming games:', error);
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

    if (loading) {
        return (
            <section id="games" className="py-20">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="text-center">
                        <h2 className="font-rajdhani text-4xl md:text-5xl font-bold text-white mb-4">
                            {t('games.title', 'БЛИЖАЙШИЕ ИГРЫ').split(' ').map((word, i, arr) =>
                                i === arr.length - 1 ? <span key={i} className="text-[#46D6C8]">{word}</span> : word + ' '
                            )}
                        </h2>
                        <p className="font-inter text-lg text-gray-400">
                            {t('common.loading', 'Loading...')}
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="games" className="py-20">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="font-rajdhani text-4xl md:text-5xl font-bold text-white mb-4">
                        {t('games.title', 'БЛИЖАЙШИЕ ИГРЫ').split(' ').map((word, i, arr) =>
                            i === arr.length - 1 ? <span key={i} className="text-[#46D6C8]">{word}</span> : word + ' '
                        )}
                    </h2>
                    <p className="font-inter text-lg text-gray-400 max-w-2xl mx-auto">
                        {t('games.subtitle', 'Присоединяйтесь к нашим тактическим операциям и почувствуйте настоящий военный дух')}
                    </p>
                </div>

                {upcomingGames.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                        {upcomingGames.map((dbEvent) => (
                            <EventCard
                                key={dbEvent.id}
                                event={mapToUIEvent(dbEvent)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="font-inter text-lg text-gray-400">
                            {t('games.no_upcoming', 'Нет запланированных игр. Загляните позже!')}
                        </p>
                    </div>
                )}

                <div className="text-center mt-16">
                    <Link
                        to="/games"
                        className="inline-flex items-center gap-2 font-rajdhani text-lg font-bold text-[#46D6C8] hover:text-white transition-colors cursor-target"
                        tabIndex={0}
                        aria-label={t('games.cta.all_games', 'Все игры')}
                    >
                        {t('games.cta.all_games', 'ВСЕ ИГРЫ')}
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default GamesSection;
