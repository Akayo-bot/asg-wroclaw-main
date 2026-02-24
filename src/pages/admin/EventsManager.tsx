import React, { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SearchBarNeon } from '@/components/admin/SearchBarNeon';
import { NeonPopoverList } from '@/components/admin/NeonPopoverList';
import { useToast } from '@/hooks/use-toast';
import LoadingScreen from '@/components/LoadingScreen';
import { Tables, Database } from '@/integrations/supabase/types';
import EventModal from '@/components/admin/EventModal';
import EventCard from '@/components/events/EventCard';
import { Event as UIEvent, EventStatus } from '@/types/Event';
import AdminShell from '@/components/admin/AdminShell';
import { GlassConfirmDialog } from '@/components/ui/GlassConfirmDialog';

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
    gathering_time: string;
    duration: string;
}

const EventsManager = () => {
    const { t, language } = useI18n();
    const { toast } = useToast();
    const [events, setEvents] = useState<DBEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'open' | 'full' | 'completed' | 'cancelled'>('all');
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
        gathering_time: '',
        duration: '',
    });

    useEffect(() => {
        fetchEvents();
    }, [statusFilter]);

    // Auto-update status for past events
    useEffect(() => {
        const checkEventStatuses = async () => {
             if (events.length === 0) return;
             
             const now = new Date();
             const eventsToUpdate = events.filter(e => {
                 if (e.status === 'completed' || e.status === 'cancelled') return false;
                 
                 // Check if event is in the past
                 if (e.start_datetime) {
                     const eventDate = new Date(e.start_datetime);
                     // If event ended logic (e.g. 4 hours after start? or just start?)
                     // User said "If game was open and date comes, switch to completed"
                     // Usually implies start time passed.
                     return eventDate < now;
                 }
                 return false;
             });

             if (eventsToUpdate.length > 0) {
                 console.log('Auto-completing events:', eventsToUpdate.map(e => e.id));
                 
                 // process updates in parallel
                 await Promise.all(eventsToUpdate.map(event => 
                    supabase
                        .from('events')
                        .update({ status: 'completed' })
                        .eq('id', event.id)
                 ));

                 // Refresh events after all updates
                 fetchEvents();
             }
        };

        checkEventStatuses();
    }, [events.length]); // Check when events list is loaded

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

            // Custom sort: active events first (ascending), then completed/cancelled (descending)
            // Active: upcoming, registration_open, registration_closed
            // Past: completed, cancelled
            const sortedData = (data || []).sort((a, b) => {
                const isActiveA = ['upcoming', 'registration_open', 'registration_closed'].includes(a.status);
                const isActiveB = ['upcoming', 'registration_open', 'registration_closed'].includes(b.status);
                
                // Active events come before past events
                if (isActiveA && !isActiveB) return -1;
                if (!isActiveA && isActiveB) return 1;
                
                // Both active or both past - sort by date
                const dateA = new Date(a.start_datetime || a.event_date).getTime();
                const dateB = new Date(b.start_datetime || b.event_date).getTime();
                
                if (isActiveA && isActiveB) {
                    // Active events: ascending (nearest future first)
                    return dateA - dateB;
                } else {
                    // Past events: descending (most recent past first)
                    return dateB - dateA;
                }
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
                amenities: formData.amenities || [],
                event_date: new Date(formData.start_datetime).toISOString(),
                start_datetime: new Date(formData.start_datetime).toISOString(),
                duration: formData.duration,
                gathering_time: formData.gathering_time,
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
        } catch (error: any) {
            console.error('Error saving event:', error);
            
            let errorMessage = t('events.save_error', 'Failed to save event');
            if (error?.code === '23505') {
                errorMessage = 'Event with this title already exists.';
            } else if (error?.message) {
                errorMessage = `Error: ${error.message}`;
            }

            toast({
                title: t('common.error', 'Error'),
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const handleDeleteClick = (id: string) => {
        setDeleteConfirmId(id);
    };

    const deleteEvent = async (id: string) => {

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
            gathering_time: '',
            duration: '',
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
            start_datetime: event.start_datetime || (event as any).event_date || '',
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
            amenities: (event as any).amenities || [],
            gathering_time: (event as any).gathering_time || (event.start_datetime ? (() => {
                const date = new Date(event.start_datetime);
                date.setHours(date.getHours() - 1);
                return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            })() : ''),
            duration: (event as any).duration || '',
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
        let dateObj = new Date(dbEvent.start_datetime || dbEvent.event_date || new Date()); // fallback to now if invalid
        if (isNaN(dateObj.getTime())) {
            dateObj = new Date(); // Double fallback
        }
        
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
            participants_registered: 0, // Placeholder
            price: dbEvent.price_amount || 0,
            currency: dbEvent.price_currency || 'UAH',
            status: status,
            gathering_time: gatheringTime,
            start_time: startTime,
            duration: dbEvent.duration || '',
            amenities: (dbEvent as any).amenities || [],
            game_meta: getLoc('scenario'),
            rules_safety: getLoc('rules')
        };
    };

    if (loading && events.length === 0) {
        return <LoadingScreen label="SCANNING TARGETS…" size={140} />;
    }

    const handleStatusChange = async (event: DBEvent, newStatus: string) => {
        try {
            console.log('Updating status for event:', event.id, 'to', newStatus);
            // Verify newStatus is one of the valid enum values
            const validStatuses = ['upcoming', 'registration_open', 'registration_closed', 'completed', 'cancelled'];
            if (!validStatuses.includes(newStatus)) {
                console.error('Invalid status:', newStatus);
                return;
            }

            const { error } = await supabase
                .from('events')
                .update({ status: newStatus as Database["public"]["Enums"]["event_status"] })
                .eq('id', event.id);

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }

            // Optimistic update
            setEvents(prevEvents => prevEvents.map(e => e.id === event.id ? { ...e, status: newStatus as Database["public"]["Enums"]["event_status"] } : e));
            
            // Ensure data consistency by refetching - commented out to favor optimistic
            // fetchEvents();

            toast({
                title: t('common.success', 'Success'),
                description: t('events.updated', 'Status updated successfully'),
            });
        } catch (error) {
            console.error('Error updating status:', error);
            fetchEvents(); // Revert on error
            toast({
                title: t('common.error', 'Error'),
                description: t('events.update_error', 'Failed to update status'),
                variant: 'destructive',
            });
        }
    };

    return (
        <AdminShell>
            <section className="px-3 sm:px-4 lg:px-8 lg:translate-x-[-100px]">
                {/* Search */}
                <SearchBarNeon
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder={t('events.search_placeholder', 'Search events...')}
                />

                {/* Filters & Actions */}
                <div className="mx-auto max-w-3xl pb-3 sm:pb-4 mt-3 sm:mt-4">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <NeonPopoverList
                            value={statusFilter}
                            onChange={(v) => setStatusFilter(v as any)}
                            options={[
                                { id: "all", label: t('events.all_statuses', 'All Statuses'), textColor: "text-neutral-300", hoverColor: "teal" },
                                { id: "upcoming", label: "Анонс", textColor: "text-blue-400", hoverColor: "blue" },
                                { id: "open", label: "Открыт набор", textColor: "text-emerald-400", hoverColor: "emerald" },
                                { id: "full", label: "Мест нет", textColor: "text-amber-400", hoverColor: "amber" },
                                { id: "completed", label: "Завершено", textColor: "text-slate-400", hoverColor: "teal" },
                                { id: "cancelled", label: "Отменено", textColor: "text-rose-400", hoverColor: "rose" },
                            ]}
                            color="teal"
                            minW={180}
                        />
                        
                        <button
                            type="button"
                            onClick={() => { resetForm(); setIsDialogOpen(true); }}
                            className="btn-glass-emerald text-base px-4 py-2.5 hover:ring-2 hover:ring-[#46D6C8]/50 transition-all duration-200 w-full sm:w-auto"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Plus className="h-4 w-4" />
                                <span>{t('events.add_event', 'Add Event')}</span>
                            </span>
                        </button>
                    </div>
                </div>

                {/* List / Grid */}
                <div className="mx-auto max-w-[1400px] py-4 sm:py-6 mt-4 sm:mt-6 relative">
                    {/* Мягкий radial-gradient под таблицу */}
                    <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(70,214,200,.08),transparent_70%)] opacity-50 rounded-2xl" />
                    
                    {filteredEvents.length === 0 ? (
                        <section className="glass-card relative rounded-2xl p-6 md:p-7 border border-[#46D6C8]/20 bg-[#04070A]/80 backdrop-blur-sm">
                            <span className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_70%_at_50%_0%,rgba(70,214,200,.12),transparent_60%)]" />
                            <h3 className="text-center text-slate-200 font-medium">{t('events.no_events', 'No events found')}</h3>
                            <p className="text-center text-slate-400 mt-1">{t('admin.tryChangeFilters', 'Спробуйте змінити фільтри…')}</p>
                        </section>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredEvents.map((dbEvent) => (
                                <EventCard 
                                    key={`${dbEvent.id}-${dbEvent.status}`} // Force re-render on status change
                                    event={mapToUIEvent(dbEvent)}
                                    onEdit={() => editEvent(dbEvent)}
                                    onDelete={() => handleDeleteClick(dbEvent.id)}
                                    onStatusChange={(newStatus) => handleStatusChange(dbEvent, newStatus)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <EventModal
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    onSubmit={handleModalSubmit}
                    editingEvent={editingEvent}
                    formData={formData}
                    setFormData={setFormData}
                    loading={loading}
                />
            </section>

            <GlassConfirmDialog
                open={!!deleteConfirmId}
                onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}
                title={t('events.confirm_delete_title', 'Видалити подію')}
                description={t('events.confirm_delete', 'Ви впевнені, що хочете видалити цю подію?')}
                confirmLabel={t('common.delete', 'Видалити')}
                cancelLabel={t('common.cancel', 'Скасувати')}
                variant="destructive"
                onConfirm={() => {
                    if (deleteConfirmId) deleteEvent(deleteConfirmId);
                }}
            />
        </AdminShell>
    );
};

export default EventsManager;