import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useI18n } from '@/contexts/I18nContext';
import { NeonPopoverList, NeonOption } from '@/components/admin/NeonPopoverList';
import { supabase } from '@/integrations/supabase/client';
import SearchBar from '@/components/ui/SearchBar';
import { useToast } from '@/hooks/use-toast';
import LoadingScreen from '@/components/LoadingScreen';
import EventCard from '@/components/events/EventCard';
import { Event as UIEvent, EventStatus } from '@/types/Event';

interface DBEvent {
    id: string;
    title_uk: string;
    title_ru: string;
    title_pl: string;
    title_en: string;
    description_uk: string;
    description_ru: string;
    description_pl: string;
    description_en: string;
    location_uk: string;
    location_ru: string;
    location_pl: string;
    location_en: string;
    rules_uk: string;
    rules_ru: string;
    rules_pl: string;
    rules_en: string;
    scenario_uk: string;
    scenario_ru: string;
    scenario_pl: string;
    scenario_en: string;
    event_date: string;
    price_amount?: number;
    price_currency: string;
    max_players?: number;
    limit_mode: string;
    min_players?: number;
    status: string;
    main_image_url?: string;
    map_url?: string;
    registration_deadline?: string;
    created_at: string;
    participants_registered?: number; // Assuming this might be a count or join
}

const GamesPage = () => {
    const { t, language } = useI18n();
    const { toast } = useToast();
    const [events, setEvents] = useState<UIEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const filters = [
        { key: 'all', label: t('games.all', 'All') },
        { key: 'upcoming', label: t('games.upcoming', 'Upcoming') },
        { key: 'registration_open', label: t('games.register', 'Registration Open') },
        { key: 'completed', label: t('games.past', 'Past') },
    ];

    // Filter events based on search term
    const filteredEvents = events.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        fetchEvents();
    }, [activeFilter, language]);

    const fetchEvents = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from('events')
                .select('*')
                .order('event_date', { ascending: true });

            // Apply filters
            if (activeFilter !== 'all') {
                if (activeFilter === 'Open') {
                    query = query.in('status', ['upcoming', 'registration_open']);
                } else if (activeFilter === 'Full') {
                    query = query.eq('status', 'registration_closed');
                } else if (activeFilter === 'Completed') {
                    query = query.eq('status', 'completed');
                } else if (activeFilter === 'Canceled') {
                    query = query.eq('status', 'cancelled');
                }
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching events:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load events',
                    variant: 'destructive',
                });
            } else {
                // Map DB events to UI Events
                const mappedEvents: UIEvent[] = (data || []).map((dbEvent: any) => {
                    const dateObj = new Date(dbEvent.event_date);
                    
                    // Helper to get localized string
                    const getLoc = (keyPrefix: string) => {
                        const key = `${keyPrefix}_${language}`;
                        return dbEvent[key] || dbEvent[`${keyPrefix}_uk`] || '';
                    };

                    // Calculate gathering time (1 hour before start)
                    const gatheringTime = new Date(dateObj.getTime() - 60 * 60 * 1000).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });
                    const startTime = dateObj.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });

                    // Map status
                    let status: EventStatus = 'Open';
                    if (dbEvent.status === 'cancelled') status = 'Canceled';
                    if (dbEvent.status === 'completed') status = 'Completed';
                    if (dbEvent.status === 'registration_closed') status = 'Full';
                    
                    // Check participants limit
                    // Note: We don't have real participants count in this simple query, defaulting to 0 or random for demo if needed, 
                    // but ideally should be a count from a related table. For now using 0.
                    const registered = 0; 

                    return {
                        id: dbEvent.id,
                        image_url: dbEvent.main_image_url || 'https://images.unsplash.com/photo-1627916527022-7933930b1b13?q=80&w=2940&auto=format&fit=crop',
                        title: getLoc('title'),
                        date: dateObj.toLocaleDateString(language),
                        location_name: getLoc('location'),
                        location_map_url: dbEvent.map_url || '#',
                        participant_limit: dbEvent.max_players || 0,
                        participants_registered: registered,
                        price: dbEvent.price_amount || 0,
                        currency: dbEvent.price_currency || 'UAH',
                        status: status,
                        gathering_time: gatheringTime,
                        start_time: startTime,
                        duration: '4-6 hours', // Placeholder
                        amenities: ['Parking', 'Rental', 'Tea/Coffee'], // Placeholders
                        game_meta: getLoc('scenario'),
                        rules_safety: getLoc('rules')
                    };
                });
                setEvents(mappedEvents);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingScreen label="SCANNING TARGETS…" size={140} />;
    }

    return (
        <Layout showBreadcrumbs>
            <div className="min-h-screen py-12">
                <div className="container mx-auto px-4 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="font-rajdhani text-4xl md:text-5xl font-bold mb-4">
                            {t('games.title', 'Games')}
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            {t('games.subtitle', 'Upcoming games and events')}
                        </p>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center">
                        <div className="w-full md:w-1/2">
                             <SearchBar 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                placeholder={t('games.search_placeholder', 'Search games...')}
                            />
                        </div>
                        
                        <div className="w-full md:w-auto">
                            <NeonPopoverList
                                value={activeFilter}
                                onChange={(v) => setActiveFilter(v)}
                                options={[
                                    { id: "all", label: t('games.filter_all', 'All Games'), textColor: "text-neutral-300", hoverColor: "teal" },
                                    { id: "Open", label: "Открыт набор", textColor: "text-emerald-400", hoverColor: "emerald" },
                                    { id: "Full", label: "Мест нет", textColor: "text-amber-400", hoverColor: "amber" },
                                    { id: "Completed", label: "Завершено", textColor: "text-slate-400", hoverColor: "teal" },
                                    { id: "Canceled", label: "Отменено", textColor: "text-rose-400", hoverColor: "rose" },
                                ]}
                                color="teal"
                                minW={180}
                            />
                        </div>
                    </div>

                    {/* Games Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEvents.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>

                    {/* Empty State */}
                    {filteredEvents.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">
                                {t('games.no_games', 'No games available')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default GamesPage;