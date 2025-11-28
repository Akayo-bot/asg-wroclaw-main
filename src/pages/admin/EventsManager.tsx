import React, { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import SearchBar from '@/components/ui/SearchBar';
import { NeonPopoverList, NeonOption } from '@/components/admin/NeonPopoverList';
import { useToast } from '@/hooks/use-toast';
import LoadingScreen from '@/components/LoadingScreen';
import { Tables } from '@/integrations/supabase/types';
import EventModal from '@/components/admin/EventModal';
import EventCard from '@/components/events/EventCard';
import { Event as UIEvent, EventStatus } from '@/types/Event';

type DBEvent = Tables<'events'>;

interface EventForm {
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
    start_datetime: string;
    registration_deadline: string;
    price_amount: string;
    price_currency: string;
    min_players: string;
    max_players: string;
    limit_mode: string;
    status: string;
    status_registration: string;
    main_image_url: string;
    cover_url: string;
    map_url: string;
    amenities: string[];
}

const EventsManager = () => {
    const { t, language } = useI18n();
    const { toast } = useToast();
    const [events, setEvents] = useState<DBEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'full' | 'completed' | 'cancelled'>('all');
    const [editingEvent, setEditingEvent] = useState<DBEvent | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState<EventForm>({
        title_uk: '',
        title_ru: '',
        title_pl: '',
        title_en: '',
        description_uk: '',
        description_ru: '',
        description_pl: '',
        description_en: '',
        location_uk: '',
        location_ru: '',
        location_pl: '',
        location_en: '',
        rules_uk: '',
        rules_ru: '',
        rules_pl: '',
        rules_en: '',
        scenario_uk: '',
        scenario_ru: '',
        scenario_pl: '',
        scenario_en: '',
        start_datetime: '',
        registration_deadline: '',
        price_amount: '',
        price_currency: 'PLN',
        min_players: '',
        max_players: '',
        limit_mode: 'unlimited',
        status: 'upcoming',
        status_registration: 'open',
        main_image_url: '',
        cover_url: '',
        map_url: '',
        amenities: [],
    });

    useEffect(() => {
        fetchEvents();
    }, [statusFilter]);

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

            query = query.order('start_datetime', { ascending: false });

            const { data, error } = await query;
            if (error) throw error;

            setEvents(data || []);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const eventData = {
                title_uk: formData.title_uk,
                title_ru: formData.title_ru,
                title_pl: formData.title_pl,
                title_en: formData.title_en,
                description_uk: formData.description_uk,
                description_ru: formData.description_ru,
                description_pl: formData.description_pl,
                description_en: formData.description_en,
                location_uk: formData.location_uk,
                location_ru: formData.location_ru,
                location_pl: formData.location_pl,
                location_en: formData.location_en,
                rules_uk: formData.rules_uk,
                rules_ru: formData.rules_ru,
                rules_pl: formData.rules_pl,
                rules_en: formData.rules_en,
                scenario_uk: formData.scenario_uk,
                scenario_ru: formData.scenario_ru,
                scenario_pl: formData.scenario_pl,
                scenario_en: formData.scenario_en,
                registration_deadline: formData.registration_deadline ? new Date(formData.registration_deadline).toISOString() : null,
                price_amount: formData.price_amount ? parseFloat(formData.price_amount) : null,
                price_currency: formData.price_currency,
                min_players: formData.min_players ? parseInt(formData.min_players) : null,
                max_players: formData.max_players ? parseInt(formData.max_players) : null,
                limit_mode: formData.limit_mode,
                status: formData.status as 'upcoming' | 'registration_open' | 'registration_closed' | 'completed' | 'cancelled',
                status_registration: formData.status_registration as 'open' | 'closed' | 'waitlist',
                created_by: user?.id || '',
                main_image_url: formData.main_image_url || null,
                cover_url: formData.cover_url || null,
                map_url: formData.map_url || null,
                event_date: new Date(formData.start_datetime).toISOString(),
            };

            if (editingEvent) {
                const { error } = await supabase
                    .from('events')
                    .update(eventData)
                    .eq('id', editingEvent.id);

                if (error) throw error;

                toast({
                    title: t('common.success', 'Success'),
                    description: t('events.updated', 'Event updated successfully'),
                });
            } else {
                const { error } = await supabase
                    .from('events')
                    .insert([eventData]);

                if (error) throw error;

                toast({
                    title: t('common.success', 'Success'),
                    description: t('events.created', 'Event created successfully'),
                });
            }

            resetForm();
            fetchEvents();
        } catch (error) {
            console.error('Error saving event:', error);
            toast({
                title: t('common.error', 'Error'),
                description: t('events.save_error', 'Failed to save event'),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const deleteEvent = async (id: string) => {
        if (!confirm(t('events.confirm_delete', 'Are you sure you want to delete this event?'))) return;

        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setEvents(events.filter(event => event.id !== id));
            toast({
                title: t('common.success', 'Success'),
                description: t('events.deleted', 'Event deleted successfully'),
            });
        } catch (error) {
            console.error('Error deleting event:', error);
            toast({
                title: t('common.error', 'Error'),
                description: t('events.delete_error', 'Failed to delete event'),
                variant: 'destructive',
            });
        }
    };

    const resetForm = () => {
        setFormData({
            title_uk: '',
            title_ru: '',
            title_pl: '',
            title_en: '',
            description_uk: '',
            description_ru: '',
            description_pl: '',
            description_en: '',
            location_uk: '',
            location_ru: '',
            location_pl: '',
            location_en: '',
            rules_uk: '',
            rules_ru: '',
            rules_pl: '',
            rules_en: '',
            scenario_uk: '',
            scenario_ru: '',
            scenario_pl: '',
            scenario_en: '',
            start_datetime: '',
            registration_deadline: '',
            price_amount: '',
            price_currency: 'PLN',
            min_players: '',
            max_players: '',
            limit_mode: 'unlimited',
            status: 'upcoming',
            status_registration: 'open',
            main_image_url: '',
            cover_url: '',
            map_url: '',
            amenities: [],
        });
        setEditingEvent(null);
        setIsDialogOpen(false);
    };

    const editEvent = (event: DBEvent) => {
        setEditingEvent(event);
        setFormData({
            title_uk: event.title_uk,
            title_ru: event.title_ru,
            title_pl: event.title_pl,
            title_en: event.title_en || '',
            description_uk: event.description_uk,
            description_ru: event.description_ru,
            description_pl: event.description_pl,
            description_en: event.description_en || '',
            location_uk: event.location_uk,
            location_ru: event.location_ru,
            location_pl: event.location_pl,
            location_en: event.location_en || '',
            rules_uk: event.rules_uk || '',
            rules_ru: event.rules_ru || '',
            rules_pl: event.rules_pl || '',
            rules_en: event.rules_en || '',
            scenario_uk: event.scenario_uk || '',
            scenario_ru: event.scenario_ru || '',
            scenario_pl: event.scenario_pl || '',
            scenario_en: event.scenario_en || '',
            start_datetime: event.start_datetime ? new Date(event.start_datetime).toISOString().slice(0, 16) : '',
            registration_deadline: event.registration_deadline ? new Date(event.registration_deadline).toISOString().slice(0, 16) : '',
            price_amount: event.price_amount ? event.price_amount.toString() : '',
            price_currency: event.price_currency || 'PLN',
            min_players: event.min_players ? event.min_players.toString() : '',
            max_players: event.max_players ? event.max_players.toString() : '',
            limit_mode: event.limit_mode || 'unlimited',
            status: event.status,
            status_registration: event.status_registration || 'open',
            main_image_url: event.main_image_url || '',
            cover_url: event.cover_url || '',
            map_url: event.map_url || '',
            amenities: [],
        });
        setIsDialogOpen(true);
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

    const filteredEvents = events.filter(event => {
        if (searchTerm) {
            const title = getTitle(event).toLowerCase();
            const location = getLocation(event).toLowerCase();
            if (!title.includes(searchTerm.toLowerCase()) && !location.includes(searchTerm.toLowerCase())) {
                return false;
            }
        }
        return true;
    });

    const handleModalSubmit = async (data: EventForm) => {
        await handleSubmit({ preventDefault: () => { } } as React.FormEvent);
    };

    // Helper to map DBEvent to UIEvent
    const mapToUIEvent = (dbEvent: DBEvent): UIEvent => {
        const dateObj = new Date(dbEvent.start_datetime || dbEvent.event_date); // fallback
        
        // Helper to get localized string from dbEvent
        const getLoc = (keyPrefix: string) => {
            // @ts-ignore - dynamic access
            const key = `${keyPrefix}_${language}`;
            // @ts-ignore
            return dbEvent[key] || dbEvent[`${keyPrefix}_uk`] || '';
        };

        const gatheringTime = new Date(dateObj.getTime() - 60 * 60 * 1000).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });
        const startTime = dateObj.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });

        let status: EventStatus = 'Open';
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
            participants_registered: 0, // Placeholder
            price: dbEvent.price_amount || 0,
            currency: dbEvent.price_currency || 'UAH',
            status: status,
            gathering_time: gatheringTime,
            start_time: startTime,
            duration: '4-6 hours',
            amenities: ['Parking', 'Rental', 'Tea/Coffee'],
            game_meta: getLoc('scenario'),
            rules_safety: getLoc('rules')
        };
    };

    if (loading && events.length === 0) {
        return <LoadingScreen label="SCANNING TARGETS…" size={140} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">{t('events.title', 'Events Management')}</h1>
                    <p className="text-muted-foreground">{t('events.description', 'Manage your airsoft events and games')}</p>
                </div>

                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('events.add_event', 'Add Event')}
                </Button>

                <EventModal
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    onSubmit={handleModalSubmit}
                    editingEvent={editingEvent}
                    formData={formData}
                    setFormData={setFormData}
                    loading={loading}
                />
            </div>



            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <SearchBar 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        placeholder={t('events.search_placeholder', 'Search events...')}
                    />
                </div>

                <NeonPopoverList
                    value={statusFilter}
                    onChange={(v) => setStatusFilter(v as any)}
                    options={[
                        { id: "all", label: t('events.all_statuses', 'All Statuses'), textColor: "text-neutral-300", hoverColor: "teal" },
                        { id: "open", label: "Открыт набор", textColor: "text-emerald-400", hoverColor: "emerald" },
                        { id: "full", label: "Мест нет", textColor: "text-amber-400", hoverColor: "amber" },
                        { id: "completed", label: "Завершено", textColor: "text-slate-400", hoverColor: "teal" },
                        { id: "cancelled", label: "Отменено", textColor: "text-rose-400", hoverColor: "rose" },
                    ]}
                    color="teal"
                    minW={180}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((dbEvent) => (
                    <EventCard 
                        key={dbEvent.id} 
                        event={mapToUIEvent(dbEvent)}
                        onEdit={() => editEvent(dbEvent)}
                        onDelete={() => deleteEvent(dbEvent.id)}
                    />
                ))}
            </div>

            {filteredEvents.length === 0 && !loading && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">{t('events.no_events', 'No events found')}</p>
                </div>
            )}
        </div>
    );
};

export default EventsManager;