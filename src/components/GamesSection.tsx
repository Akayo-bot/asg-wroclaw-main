import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Coins } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatPlayerLimits, formatDateTime } from '@/lib/formatters';
import { Tables } from '@/integrations/supabase/types';

type Event = Tables<'events'>;

const GamesSection = () => {
    const { t, language } = useI18n();
    const [upcomingGames, setUpcomingGames] = useState<Event[]>([]);
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

    const getTitle = (event: Event) => {
        const titles = {
            uk: event.title_uk,
            ru: event.title_ru,
            pl: event.title_pl,
            en: event.title_en || event.title_uk,
        };
        return titles[language as keyof typeof titles] || event.title_uk;
    };

    const getDescription = (event: Event) => {
        const descriptions = {
            uk: event.description_uk,
            ru: event.description_ru,
            pl: event.description_pl,
            en: event.description_en || event.description_uk,
        };
        return descriptions[language as keyof typeof descriptions] || event.description_uk;
    };

    const getLocation = (event: Event) => {
        const locations = {
            uk: event.location_uk,
            ru: event.location_ru,
            pl: event.location_pl,
            en: event.location_en || event.location_uk,
        };
        return locations[language as keyof typeof locations] || event.location_uk;
    };

    const getRegistrationButton = (event: Event) => {
        if (event.status === 'cancelled') {
            return (
                <Button variant="outline" disabled className="w-full">
                    {t('games.status.cancelled', 'Cancelled')}
                </Button>
            );
        }

        if (event.status_registration === 'closed') {
            return (
                <Button variant="outline" disabled className="w-full">
                    {t('games.registration_closed', 'Registration Closed')}
                </Button>
            );
        }

        if (event.status_registration === 'waitlist') {
            return (
                <Button variant="secondary" className="w-full">
                    {t('games.join_waitlist', 'Join Waitlist')}
                </Button>
            );
        }

        return (
            <Button className="w-full">
                {t('games.register', 'Register')}
            </Button>
        );
    };

    const getStatusBadge = (event: Event) => {
        if (event.status === 'cancelled') {
            return <Badge variant="destructive">{t('games.status.cancelled', 'Cancelled')}</Badge>;
        }

        if (event.status_registration === 'waitlist') {
            return <Badge variant="secondary">{t('games.status.waitlist', 'Waitlist')}</Badge>;
        }

        if (event.status_registration === 'closed') {
            return <Badge variant="outline">{t('games.status.full', 'Full')}</Badge>;
        }

        return <Badge variant="default">{t('games.status.open', 'Open')}</Badge>;
    };

    if (loading) {
        return (
            <section id="games" className="py-20 bg-muted/20">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="text-center">
                        <h2 className="font-rajdhani text-4xl md:text-5xl font-bold text-foreground mb-4">
                            {t('games.title', 'БЛИЖАЙШИЕ ИГРЫ').split(' ').map((word, i, arr) =>
                                i === arr.length - 1 ? <span key={i} className="text-primary">{word}</span> : word + ' '
                            )}
                        </h2>
                        <p className="font-inter text-lg text-muted-foreground">
                            {t('common.loading', 'Loading...')}
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="games" className="py-20 bg-muted/20">
            <div className="container mx-auto px-4 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="font-rajdhani text-4xl md:text-5xl font-bold text-foreground mb-4">
                        {t('games.title', 'БЛИЖАЙШИЕ ИГРЫ').split(' ').map((word, i, arr) =>
                            i === arr.length - 1 ? <span key={i} className="text-primary">{word}</span> : word + ' '
                        )}
                    </h2>
                    <p className="font-inter text-lg text-muted-foreground max-w-2xl mx-auto">
                        {t('games.subtitle', 'Присоединяйтесь к нашим тактическим операциям и почувствуйте настоящий военный дух')}
                    </p>
                </div>

                {/* Games Grid */}
                {upcomingGames.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                        {upcomingGames.map((event) => (
                            <Card key={event.id} className="group overflow-hidden rounded-2xl bg-card border hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <div className="relative">
                                    {event.main_image_url && (
                                        <div className="aspect-[16/9] overflow-hidden">
                                            <img
                                                src={event.main_image_url}
                                                alt={getTitle(event)}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4">
                                        {getStatusBadge(event)}
                                    </div>
                                </div>

                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-rajdhani text-xl font-bold text-foreground mb-2">
                                                {getTitle(event)}
                                            </h3>
                                            <p className="text-muted-foreground text-sm line-clamp-3">
                                                {getDescription(event)}
                                            </p>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                <span>
                                                    {event.start_datetime ? formatDateTime(event.start_datetime, language, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) : t('games.no_date', 'No date set')}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <MapPin className="h-4 w-4" />
                                                <span className="line-clamp-1">{getLocation(event)}</span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Users className="h-4 w-4" />
                                                    <span>
                                                        {formatPlayerLimits(event.limit_mode, event.min_players, event.max_players, 0, language)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Coins className="h-4 w-4" />
                                                    <span className="font-semibold">
                                                        {formatCurrency(event.price_amount, event.price_currency || 'PLN', language)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            {getRegistrationButton(event)}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="font-inter text-lg text-muted-foreground">
                            {t('games.no_upcoming', 'No upcoming games scheduled. Check back soon!')}
                        </p>
                    </div>
                )}

                {/* Call to Action */}
                <div className="text-center mt-16">
                    <p className="font-inter text-muted-foreground mb-6">
                        {t('games.cta.question', 'Не нашли подходящую игру? Предложите свой сценарий!')}
                    </p>
                    <button className="font-rajdhani text-lg font-bold text-primary hover:text-foreground transition-colors cursor-target">
                        {t('games.cta.contact', 'СВЯЗАТЬСЯ С ОРГАНИЗАТОРАМИ →')}
                    </button>
                </div>
            </div>
        </section>
    );
};

export default GamesSection;