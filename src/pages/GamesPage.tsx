import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Users, Clock, Filter, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LoadingScreen from '@/components/LoadingScreen';

interface Event {
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
    event_date: string;
    price?: number;
    price_currency: string;
    max_participants?: number;
    limit_mode: string;
    min_players?: number;
    max_players?: number;
    status: string;
    main_image_url?: string;
    registration_deadline?: string;
    created_at: string;
}

const GamesPage = () => {
    const { t, language } = useI18n();
    const { toast } = useToast();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');

    const filters = [
        { key: 'all', label: t('games.all', 'All') },
        { key: 'upcoming', label: t('games.upcoming', 'Upcoming') },
        { key: 'registration_open', label: t('games.register', 'Registration Open') },
        { key: 'completed', label: t('games.past', 'Past') },
    ];

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from('events')
                .select('*')
                .order('event_date', { ascending: true });

            // Apply filters
            if (activeFilter !== 'all') {
                query = query.eq('status', activeFilter as any);
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
                setEvents(data || []);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [activeFilter]);

    const getTitleForLanguage = (event: Event) => {
        switch (language) {
            case 'uk': return event.title_uk;
            case 'ru': return event.title_ru;
            case 'pl': return event.title_pl;
            case 'en': return event.title_en;
            default: return event.title_uk;
        }
    };

    const getDescriptionForLanguage = (event: Event) => {
        switch (language) {
            case 'uk': return event.description_uk;
            case 'ru': return event.description_ru;
            case 'pl': return event.description_pl;
            case 'en': return event.description_en;
            default: return event.description_uk;
        }
    };

    const getLocationForLanguage = (event: Event) => {
        switch (language) {
            case 'uk': return event.location_uk;
            case 'ru': return event.location_ru;
            case 'pl': return event.location_pl;
            case 'en': return event.location_en;
            default: return event.location_uk;
        }
    };

    const formatPrice = (price: number | undefined, currency: string) => {
        if (!price) return t('games.free', 'Free');

        try {
            return new Intl.NumberFormat(language, {
                style: 'currency',
                currency: currency,
            }).format(price);
        } catch (error) {
            // Fallback for unsupported currencies
            const symbols: Record<string, string> = {
                PLN: 'zł',
                USD: '$',
                EUR: '€',
                UAH: '₴'
            };
            return `${price} ${symbols[currency] || currency}`;
        }
    };

    const getParticipantInfo = (event: Event) => {
        if (event.limit_mode === 'unlimited') {
            return t('games.unlimited_participants', 'Unlimited');
        }

        if (event.max_players) {
            return `${t('games.max_participants', 'Max')}: ${event.max_players}`;
        }

        return t('games.no_limit', 'No limit');
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { variant: any, label: string }> = {
            upcoming: { variant: 'secondary' as const, label: t('events.status.upcoming', 'Upcoming') },
            registration_open: { variant: 'default' as const, label: t('events.status.registration_open', 'Registration Open') },
            completed: { variant: 'outline' as const, label: t('events.status.completed', 'Completed') },
            cancelled: { variant: 'destructive' as const, label: t('events.status.cancelled', 'Cancelled') },
        };
        const statusInfo = statusMap[status] || statusMap.upcoming;
        return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
    };

    const isRegistrationOpen = (event: Event) => {
        return event.status === 'registration_open' || event.status === 'upcoming';
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

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 mb-8 justify-center">
                        <Filter className="w-5 h-5 text-muted-foreground mr-2" />
                        {filters.map((filter) => (
                            <Button
                                key={filter.key}
                                variant={activeFilter === filter.key ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveFilter(filter.key)}
                                className="cursor-target"
                            >
                                {filter.label}
                            </Button>
                        ))}
                    </div>

                    {/* Games Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => (
                            <Card key={event.id} className="glass-panel tactical-lift cursor-target">
                                <CardHeader>
                                    <div className="flex justify-between items-start mb-2">
                                        <CardTitle className="font-rajdhani text-xl">
                                            {getTitleForLanguage(event)}
                                        </CardTitle>
                                        {getStatusBadge(event.status)}
                                    </div>
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(event.event_date).toLocaleDateString(language)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            {new Date(event.event_date).toLocaleTimeString(language, {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            {getLocationForLanguage(event)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            {getParticipantInfo(event)}
                                        </div>
                                        {event.price && (
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="w-4 h-4" />
                                                {formatPrice(event.price, event.price_currency)}
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {getDescriptionForLanguage(event)}
                                    </p>
                                    <Button
                                        className="w-full cursor-target"
                                        variant={isRegistrationOpen(event) ? 'default' : 'secondary'}
                                        disabled={!isRegistrationOpen(event)}
                                    >
                                        {isRegistrationOpen(event)
                                            ? t('pages.games.button.register', 'REGISTER')
                                            : t('pages.games.button.closed', 'REGISTRATION CLOSED')
                                        }
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Empty State */}
                    {events.length === 0 && (
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