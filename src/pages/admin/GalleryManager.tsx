import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Image as ImageIcon, Video, Search, ChevronDown, Calendar, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingScreen from '@/components/LoadingScreen';
import RadarLoader from '@/components/RadarLoader';
import { Tables } from '@/integrations/supabase/types';
import DomeGallery from '@/components/admin/DomeGallery';
import ImageUploader from '@/components/admin/ImageUploader';
import GalleryCard from '@/components/admin/GalleryCard';
import AdminShell from '@/components/admin/AdminShell';
import { SearchBarNeon } from '@/components/admin/SearchBarNeon';
import { NeonPopoverList } from '@/components/admin/NeonPopoverList';
import { MarqueeText } from "@/components/ui/MarqueeText";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Card from '@/components/admin/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { GlassConfirmDialog } from '@/components/ui/GlassConfirmDialog';

type GalleryItem = Tables<'gallery_items'> & {
    event?: {
        id: string;
        title_uk: string | null;
        title_ru: string | null;
        title_pl: string | null;
        title_en: string | null;
        event_date: string;
    } | null;
};

type Event = Tables<'events'>;

interface GalleryForm {
    title_uk: string;
    description_uk: string;
    file_url: string;
    file_urls?: string[];
    file_type: string;
    thumbnail_url: string;
    event_id: string | null;
}

const preloadImages = async (images: Array<{ src: string }>) => {
    await Promise.all(
        images.map(
            (img) =>
                new Promise<void>((resolve) => {
                    const image = new Image();
                    image.src = img.src;
                    image.onload = () => resolve();
                    image.onerror = () => resolve();
                })
        )
    );
};

const GalleryManager = () => {
    const { t, language } = useI18n();
    const { toast } = useToast();
    const { user } = useAuth();
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [domeImages, setDomeImages] = useState<Array<{ src: string; alt: string }>>([]);
    const [isLoadingDome, setIsLoadingDome] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [eventFilter, setEventFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all');
    const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState<GalleryForm>({
        title_uk: '',
        description_uk: '',
        file_url: '',
        file_type: 'image',
        thumbnail_url: '',
        event_id: null,
    });
    const [isMobile, setIsMobile] = useState(false);
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchEvents();
        fetchItems();
    }, [eventFilter, typeFilter]);

    // Определение мобильного устройства
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 🔥 Завантаження випадкових зображень для DomeGallery
    useEffect(() => {
        fetchRandomImagesForDome();
    }, []); // Запускаємо лише при монтуванні

    // 🔥 Функція завантаження випадкових зображень для DomeGallery
    // Завантажує ВСІ доступні зображення та заповнює 34 слоти випадковим вибором
    const fetchRandomImagesForDome = async () => {
        setIsLoadingDome(true);
        try {
            // 1. 🔥 Запитуємо ВСІ доступні фотографії (або більшу вибірку, наприклад, 100)
            const { data, error } = await supabase
                .from('gallery_items')
                .select('file_url, thumbnail_url, title_uk, title_en, title_ru, title_pl')
                .eq('file_type', 'image'); // Тільки зображення

            if (error) {
                console.error('Error fetching dome images:', error);
                setDomeImages([]);
                return;
            }

            const availableImages = (data || []).map(item => ({
                src: item.thumbnail_url || item.file_url,
                alt: item.title_uk || item.title_en || item.title_ru || item.title_pl || 'Gallery image',
                fullSrc: item.file_url
            }));

            // 2. 🔥 Якщо фотографій менше 34, створюємо випадкову "начинку"
            const finalDomeImages: Array<{ src: string; alt: string; fullSrc?: string }> = [];
            const numSlots = 34; // Кількість плиток у сфері

            if (availableImages.length > 0) {
                for (let i = 0; i < numSlots; i++) {
                    // Випадково вибираємо фотографію з доступних
                    const randomIndex = Math.floor(Math.random() * availableImages.length);
                    finalDomeImages.push(availableImages[randomIndex]);
                }
            }

            await preloadImages(finalDomeImages);
            setDomeImages(finalDomeImages);
        } catch (error) {
            console.error('Error in fetchRandomImagesForDome:', error);
            setDomeImages([]);
        } finally {
            setIsLoadingDome(false);
        }
    };

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('event_date', { ascending: false });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const fetchItems = async () => {
        try {
            setLoading(true);

            // Сначала загружаем gallery_items
            let query = supabase
                .from('gallery_items')
                .select('*');

            // Проверяем, что eventFilter является валидной строкой перед фильтрацией
            if (eventFilter && eventFilter !== 'all') {
                query = query.eq('event_id', eventFilter);
            }

            if (typeFilter !== 'all') {
                query = query.ilike('file_type', `${typeFilter}%`);
            }

            query = query.order('created_at', { ascending: false });

            const { data: itemsData, error: itemsError } = await query;
            if (itemsError) {
                console.error('Error fetching gallery items:', itemsError);
                throw itemsError;
            }

            // Получаем уникальные event_id из загруженных элементов
            // Фильтруем все null, undefined и невалидные значения
            const eventIds = [...new Set(
                (itemsData || [])
                    .map((item: any) => item.event_id)
                    .filter((id: string | null | undefined): id is string => {
                        // Проверяем, что id является валидной непустой строкой
                        return typeof id === 'string' && id.length > 0 && id !== 'undefined' && id !== 'null';
                    })
            )];

            // Загружаем события для этих event_id
            // Дополнительная проверка: убеждаемся, что массив не пустой и не содержит undefined
            let eventsData: Event[] = [];
            if (eventIds.length > 0 && eventIds.every(id => typeof id === 'string' && id.length > 0)) {
                try {
                    const { data: events, error: eventsError } = await supabase
                        .from('events')
                        .select('*')
                        .in('id', eventIds);

                    if (eventsError) {
                        console.warn('Error fetching events for gallery items:', eventsError);
                    } else {
                        eventsData = events || [];
                    }
                } catch (error) {
                    console.warn('Error in events query:', error);
                }
            }

            // Создаем мапу событий для быстрого поиска
            const eventsMap = new Map(eventsData.map(event => [event.id, event]));

            // Объединяем данные
            const transformedData = (itemsData || []).map((item: any) => ({
                ...item,
                event: item.event_id ? (eventsMap.get(item.event_id) || null) : null,
            }));

            setItems(transformedData as GalleryItem[]);
        } catch (error) {
            console.error('Error fetching gallery items:', error);
            toast({
                title: t('common.error', 'Помилка'),
                description: t('gallery.fetch_error', 'Не вдалося завантажити елементи галереї'),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        const newErrors: Record<string, boolean> = {};
        const missingFields = [];

        if (!formData.file_url?.trim() && (!formData.file_urls || formData.file_urls.length === 0)) {
            newErrors['file_url'] = true;
            missingFields.push("Медіафайл");
        }
        if (!formData.title_uk?.trim()) {
            newErrors['title_uk'] = true;
            missingFields.push("Заголовок");
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast({
                variant: "destructive",
                title: "Помилка валідації",
                description: `Будь ласка, заповніть наступні поля: ${missingFields.join(", ")}`,
                className: "bg-[#1a0505]/95 backdrop-blur-md border border-red-500/30 text-red-100 shadow-[0_0_30px_rgba(220,38,38,0.25)] rounded-2xl",
                duration: 5000,
            });
            return;
        }

        setLoading(true);

        try {
            // Копируем UKR данные в другие языки (для совместимости с БД)
            const payload = {
                title_uk: formData.title_uk,
                title_ru: formData.title_uk, // Копируем из UKR
                title_pl: formData.title_uk, // Копируем из UKR
                title_en: formData.title_uk, // Копируем из UKR
                description_uk: formData.description_uk,
                description_ru: formData.description_uk, // Копируем из UKR
                description_pl: formData.description_uk, // Копируем из UKR
                description_en: formData.description_uk, // Копируем из UKR
                file_url: formData.file_url,
                file_type: formData.file_type,
                thumbnail_url: formData.thumbnail_url || formData.file_url, // Используем file_url если thumbnail_url пустой
                event_id: formData.event_id || null,
            };

            if (editingItem) {
                const { error } = await supabase
                    .from('gallery_items')
                    .update({
                        ...payload,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editingItem.id);

                if (error) throw error;

                toast({
                    title: t('common.success', 'Успіх'),
                    description: t('gallery.updated', 'Елемент галереї оновлено успішно'),
                });
            } else {
                // Получаем user ID из контекста или из auth
                const userId = user?.id || (await supabase.auth.getUser()).data.user?.id;

                if (!userId) {
                    throw new Error('User ID not found. Please log in again.');
                }

                // 🔥 MULTIPLE FILES CREATION
                if (formData.file_urls && formData.file_urls.length > 0) {
                    console.log('Creating multiple gallery items:', formData.file_urls.length);
                    
                    const createPromises = formData.file_urls.map(url => {
                        return supabase
                            .from('gallery_items')
                            .insert({
                                ...payload,
                                file_url: url, // Override with specific URL
                                uploaded_by: userId,
                            });
                    });

                    const results = await Promise.all(createPromises);
                    
                    // Check for errors
                    const errors = results.filter(r => r.error).map(r => r.error);
                    if (errors.length > 0) {
                        console.error('Some items failed to create:', errors);
                        throw errors[0]; // Throw first error
                    }

                    toast({
                        title: t('common.success', 'Успіх'),
                        description: t('gallery.created_multiple', `Створено ${formData.file_urls.length} елементів`),
                    });

                } else {
                    // SINGLE FILE CREATION (Legacy/Fallback)
                    console.log('Inserting gallery item with payload:', {
                        ...payload,
                        uploaded_by: userId,
                    });

                    const { data, error } = await supabase
                        .from('gallery_items')
                        .insert({
                            ...payload,
                            uploaded_by: userId,
                        })
                        .select()
                        .single();

                    if (error) {
                        console.error('Supabase insert error:', error);
                        throw error;
                    }

                    toast({
                        title: t('common.success', 'Успіх'),
                        description: t('gallery.created', 'Елемент галереї створено успішно'),
                    });
                }
            }

            resetForm();
            fetchItems();
            // Оновлюємо випадкові зображення для DomeGallery після збереження
            // (тільки якщо немає активних фільтрів, щоб не перезавантажувати зайвий раз)
            fetchRandomImagesForDome();
        } catch (error: any) {
            console.error('Error saving gallery item:', error);
            console.error('Error type:', typeof error);
            console.error('Error keys:', Object.keys(error || {}));

            // Более детальное сообщение об ошибке
            let errorMessage = t('gallery.save_error', 'Не вдалося зберегти елемент галереї');

            if (error?.code === '42501' || error?.code === 'PGRST301') {
                errorMessage = 'Доступ заборонено. Перевірте ваші права доступу. Можливо, потрібно застосувати міграцію RLS.';
            } else if (error?.code === '23505') {
                errorMessage = 'Такий запис вже існує.';
            } else if (error?.code === '23503') {
                errorMessage = 'Помилка зовнішнього ключа. Перевірте event_id.';
            } else if (error?.message) {
                errorMessage = `${t('gallery.save_error', 'Не вдалося зберегти елемент галереї')}: ${error.message}`;
            }

            toast({
                title: t('common.error', 'Помилка'),
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

    const deleteItem = async (id: string) => {

        try {
            const { error } = await supabase
                .from('gallery_items')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setItems(items.filter(item => item.id !== id));
            toast({
                title: t('common.success', 'Успіх'),
                description: t('gallery.deleted', 'Елемент галереї видалено успішно'),
            });
        } catch (error) {
            console.error('Error deleting gallery item:', error);
            toast({
                title: t('common.error', 'Помилка'),
                description: t('gallery.delete_error', 'Не вдалося видалити елемент галереї'),
                variant: 'destructive',
            });
        }
    };

    const resetForm = () => {
        setFormData({
            title_uk: '',
            description_uk: '',
            file_url: '',
            file_urls: [],
            file_type: 'image',
            thumbnail_url: '',
            event_id: null,
        });
        setEditingItem(null);
        setIsDialogOpen(false);
    };

    const editItem = (item: GalleryItem) => {
        setEditingItem(item);
        setFormData({
            title_uk: item.title_uk || '',
            description_uk: item.description_uk || '',
            file_url: item.file_url,
            file_type: item.file_type,
            thumbnail_url: item.thumbnail_url || '',
            event_id: (item as any).event_id || null,
        });
        setIsDialogOpen(true);
    };

    const getTitle = (item: GalleryItem) => {
        const titles = {
            uk: item.title_uk,
            ru: item.title_ru,
            pl: item.title_pl,
            en: item.title_uk, // fallback
        };
        return titles[language] || item.title_uk || 'Untitled';
    };

    const getEventTitle = (event: Event | null | undefined) => {
        if (!event) return null;
        const titles = {
            uk: event.title_uk,
            ru: event.title_ru,
            pl: event.title_pl,
            en: event.title_en || event.title_uk,
        };
        return titles[language] || event.title_uk || 'Untitled';
    };

    const formatEventDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const filteredItems = items.filter(item => {
        if (searchTerm) {
            const title = getTitle(item).toLowerCase();
            if (!title.includes(searchTerm.toLowerCase())) return false;
        }
        return true;
    });

    // Группировка по событиям, если выбран фильтр события
    const selectedEvent = (eventFilter && eventFilter !== 'all') ? events.find(e => e.id === eventFilter) : null;
    const getEventTitleForFilter = (event: Event) => {
        const titles = {
            uk: event.title_uk,
            ru: event.title_ru,
            pl: event.title_pl,
            en: event.title_en || event.title_uk,
        };
        return titles[language] || event.title_uk || 'Untitled';
    };

    // Проверка активных фильтров для показа DomeGallery
    const hasActiveFilters = useMemo(() => {
        return eventFilter !== 'all' || typeFilter !== 'all' || searchTerm.length > 0;
    }, [eventFilter, typeFilter, searchTerm]);

    const domeConfig = useMemo(() => {
        if (isMobile) {
            return {
                fit: 0.58,
                minRadius: 340,
                padFactor: 0.2,
                dragSensitivity: 18, // Увеличено с 26 для более быстрой прокрутки
                segments: 22,
                openedImageWidth: '85vw',  // Reduced from 92vw
                openedImageHeight: '70vh', // Reduced from 82vh
                imageBorderRadius: '18px',
                openedImageBorderRadius: '22px'
            };
        }

        return {
            fit: 0.52,
            minRadius: 550,
            padFactor: 0.22,
            dragSensitivity: 18,
            segments: 30,
            openedImageWidth: '420px',
            openedImageHeight: '420px',
            imageBorderRadius: '28px',
            openedImageBorderRadius: '32px'
        };
    }, [isMobile]);


    if (loading && items.length === 0) {
        return <LoadingScreen label="SCANNING TARGETS…" size={140} />;
    }

    return (
        <AdminShell>
            <div className="px-3 sm:px-4 lg:px-8 lg:translate-x-[-100px]">
                {/* Search */}
                <SearchBarNeon
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder={t('gallery.search_placeholder', 'Search gallery items...')}
                />

                {/* Filters & Actions */}
                <div className="mx-auto max-w-4xl pb-3 sm:pb-4 mt-3 sm:mt-4">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        {/* Event Filter */}
                        <NeonPopoverList
                            value={eventFilter}
                            onChange={(v) => setEventFilter(v)}
                            disablePortal={true}
                            options={[
                                { id: "all", label: t('gallery.all_events', 'Всі Події'), textColor: "text-neutral-300", hoverColor: "teal" },
                                ...events.map(event => ({
                                    id: event.id,
                                    label: (
                                        <MarqueeText>
                                            <span className="text-amber-400 font-semibold text-base whitespace-nowrap">{getEventTitle(event)}</span>
                                            <span className="text-[#C2C2C2] text-sm whitespace-nowrap ml-2">• {formatEventDate(event.event_date)}</span>
                                        </MarqueeText>
                                    ),
                                    textLabel: `${getEventTitle(event)} - ${formatEventDate(event.event_date)}`,
                                    textColor: "text-white",
                                    hoverColor: "emerald"
                                }))
                            ]}
                            color="teal"
                            minW={320}
                        />

                        {/* Type Filter */}
                        <NeonPopoverList
                            value={typeFilter}
                            onChange={(v) => setTypeFilter(v as any)}
                            disablePortal={true}
                            options={[
                                { id: "all", label: t('gallery.all_types', 'Всі Типи'), textColor: "text-neutral-300", hoverColor: "teal" },
                                { id: "image", label: t('gallery.images', 'Фото'), textColor: "text-emerald-400", hoverColor: "emerald" },
                                { id: "video", label: t('gallery.videos', 'Відео'), textColor: "text-amber-400", hoverColor: "amber" },
                            ]}
                            color="teal"
                            minW={140}
                        />

                        {/* Add Button */}
                        <button
                            type="button"
                            onClick={() => { resetForm(); setIsDialogOpen(true); }}
                            className="btn-glass-emerald text-base px-4 py-2.5 hover:ring-2 hover:ring-[#46D6C8]/50 transition-all duration-200 w-full sm:w-auto"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Plus className="h-4 w-4" />
                                <span>{t('gallery.add_item', 'Додати Медіа')}</span>
                            </span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="mx-auto max-w-[1400px] py-4 sm:py-6 mt-4 sm:mt-6 relative">
                    {/* Gradient */}
                    <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(70,214,200,.08),transparent_70%)] opacity-50 rounded-2xl" />

                    {/* Dome Gallery (if no filters) */}
                    {!hasActiveFilters && (
                        <div className="w-full h-[500px] mb-8 rounded-xl overflow-hidden border border-[#46D6C8]/20 bg-black/40 shadow-[0_0_25px_rgba(70,214,200,0.05)]">
                            {isLoadingDome ? (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <div className="text-center">
                                        <RadarLoader label={t('gallery.loading_dome', 'Завантаження галереї...')} size={80} />
                                    </div>
                                </div>
                            ) : domeImages.length > 0 ? (
                                <DomeGallery
                                    images={domeImages}
                                    fit={domeConfig.fit}
                                    fitBasis="auto"
                                    minRadius={domeConfig.minRadius}
                                    maxRadius={Infinity}
                                    padFactor={domeConfig.padFactor}
                                    overlayBlurColor="#060010"
                                    maxVerticalRotationDeg={5}
                                    dragSensitivity={domeConfig.dragSensitivity}
                                    enlargeTransitionMs={300}
                                    segments={domeConfig.segments}
                                    dragDampening={2}
                                    openedImageWidth={domeConfig.openedImageWidth}
                                    openedImageHeight={domeConfig.openedImageHeight}
                                    imageBorderRadius={domeConfig.imageBorderRadius}
                                    openedImageBorderRadius={domeConfig.openedImageBorderRadius}
                                    isMobile={isMobile}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <p>{t('gallery.no_images_for_dome', 'Немає зображень для відображення')}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map((item) => (
                            <GalleryCard
                                key={item.id}
                                item={item}
                                language={language}
                                onEdit={editItem}
                                onDelete={handleDeleteClick}
                            />
                        ))}
                    </div>

                    {/* Empty State */}
                    {filteredItems.length === 0 && (
                        <div className="rounded-xl p-8 border border-white/10 bg-black/60 backdrop-blur-sm text-center">
                            <p className="text-gray-400">{t('gallery.no_items', 'No gallery items found')}</p>
                        </div>
                    )}
                </div>

                {/* Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent
                        className="max-w-2xl bg-[#04070A]/90 border-white/10 backdrop-blur-md p-0 flex flex-col shadow-[0_0_50px_rgba(70,214,200,0.15)] overflow-hidden"
                    >
                        <DialogHeader className="px-6 py-4 bg-[#04070A] relative z-50 shrink-0">
                            <DialogTitle className="text-xl font-display text-white">
                                {editingItem ? t('gallery.edit_item', 'Редагувати Медіа') : t('gallery.add_item', 'Додати Медіа')}
                            </DialogTitle>
                            {/* Top Gradient Overlay inside header container but positioned below border */}
                            <div className="absolute left-0 right-0 top-full -translate-y-px h-12 bg-gradient-to-b from-[#04070A] via-[#04070A]/80 to-transparent pointer-events-none z-50" />
                        </DialogHeader>

                        <div className="overflow-y-auto flex-1 neon-scrollbar p-6 relative z-0">
                            <form
                                onSubmit={handleSubmit}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                                className="space-y-6 pb-4 relative z-10"
                            >
                                <div className="space-y-6">
                                    {/* Media File Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-[#46D6C8] flex items-center gap-2">
                                            <ImageIcon size={20} className="text-[#46D6C8]" />
                                            Медіафайл
                                        </h3>
                                        
                                        <ImageUploader
                                            label="Медіафайл"
                                            currentUrl={formData.file_url}
                                            error={!!errors['file_url']}
                                            onUpload={(url) => {
                                                setFormData({ ...formData, file_url: url });
                                                if (errors['file_url']) {
                                                    setErrors(prev => {
                                                        const newErrors = { ...prev };
                                                        delete newErrors['file_url'];
                                                        return newErrors;
                                                    });
                                                }
                                            }}
                                            onUploadMany={(urls) => {
                                                setFormData({ ...formData, file_urls: urls });
                                                if (errors['file_url']) {
                                                    setErrors(prev => {
                                                        const newErrors = { ...prev };
                                                        delete newErrors['file_url'];
                                                        return newErrors;
                                                    });
                                                }
                                            }}
                                            bucket="media"
                                            folder="gallery"
                                            fileType={formData.file_type as 'image' | 'video'}
                                            multiple={!editingItem}
                                        />

                                        <div className="flex items-center gap-4 mt-4">
                                            <div className="flex-1 space-y-2">
                                                <Label className="text-sm font-medium text-white/80 block">
                                                    Тип файлу
                                                </Label>
                                                <NeonPopoverList
                                                    value={formData.file_type}
                                                    onChange={(value) => setFormData(prev => ({ ...prev, file_type: value }))}
                                                    options={[
                                                        { id: 'image', label: t('gallery.images', 'Фото'), textColor: 'text-emerald-400', hoverColor: 'teal' },
                                                        { id: 'video', label: t('gallery.videos', 'Відео'), textColor: 'text-amber-400', hoverColor: 'amber' }
                                                    ]}
                                                    width={200}
                                                    minW={140}
                                                />
                                            </div>
                                            <p className="text-sm text-gray-400 flex-shrink-0 mt-6">Вкажіть, що ви завантажуєте.</p>
                                        </div>

                                        {formData.file_type === 'video' && (
                                            <ImageUploader
                                                label="Мініатюра (опціонально)"
                                                currentUrl={formData.thumbnail_url}
                                                onUpload={(url) => setFormData({ ...formData, thumbnail_url: url })}
                                                bucket="media"
                                                folder="gallery/thumbnails"
                                            />
                                        )}
                                    </div>

                                    {/* Divider */}
                                    <div className="border-b border-white/10" />

                                    {/* Details Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-[#46D6C8] flex items-center gap-2">
                                            <Info size={20} className="text-[#46D6C8]" />
                                            Деталі
                                        </h3>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-white/80 block">
                                                {`${t('gallery.event', 'Подія')} (${t('gallery.optional', 'опціонально')})`}
                                            </Label>
                                            <NeonPopoverList
                                                value={formData.event_id || "no_event"}
                                                onChange={(value) => setFormData({ ...formData, event_id: value === "no_event" ? null : value })}
                                                disablePortal={false}
                                                width={0}
                                                minW={0}
                                                className="w-full lg:w-full"
                                                options={[
                                                    { 
                                                        id: "no_event", 
                                                        label: t('gallery.no_event', 'Без події'), 
                                                        textLabel: t('gallery.no_event', 'Без події'),
                                                        textColor: "text-white"
                                                    },
                                                    ...events.map((event) => ({
                                                        id: event.id,
                                                        label: (
                                                            <MarqueeText>
                                                                <span className="text-amber-400 font-semibold text-base whitespace-nowrap">{getEventTitle(event)}</span>
                                                                <span className="text-[#C2C2C2] text-sm whitespace-nowrap ml-2">• {formatEventDate(event.event_date)}</span>
                                                            </MarqueeText>
                                                        ),
                                                        textLabel: `${getEventTitle(event)} - ${formatEventDate(event.event_date)}`,
                                                        textColor: "text-white",
                                                        hoverColor: "emerald"
                                                    }))
                                                ]}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            💡 <strong>{t('gallery.event_help', 'Використовується')}:</strong> {t('gallery.event_help_text', 'Пов\'язує медіа з конкретною подією для організації архіву.')}
                                        </p>

                                        <div>
                                            <label className="text-sm font-medium text-white/80 mb-2 block">
                                                {t('gallery.title_field', 'Заголовок')} (UKR)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.title_uk}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, title_uk: e.target.value });
                                                    if (errors['title_uk']) {
                                                        setErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors['title_uk'];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                placeholder={t('gallery.title_placeholder', 'Введіть заголовок')}
                                                className={`w-full px-3 py-2 rounded-lg bg-white/5 text-white placeholder-gray-400 focus:outline-none transition-all ${
                                                    errors['title_uk']
                                                        ? 'border border-red-500/50 shadow-[0_0_10px_rgba(220,38,38,0.2)]'
                                                        : 'border border-white/10 focus:border-[#46D6C8]/50 focus:ring-1 focus:ring-[#46D6C8]/50 hover:border-[#46D6C8]/30 hover:shadow-[0_0_15px_rgba(70,214,200,0.1)]'
                                                }`}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-white/80 mb-2 block">
                                                {t('gallery.description_field', 'Опис')} (UKR)
                                            </label>
                                            <textarea
                                                value={formData.description_uk}
                                                onChange={(e) => setFormData({ ...formData, description_uk: e.target.value })}
                                                placeholder={t('gallery.description_placeholder', 'Введіть опис')}
                                                rows={4}
                                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#46D6C8]/50 focus:ring-1 focus:ring-[#46D6C8]/50 hover:border-[#46D6C8]/30 transition-all hover:shadow-[0_0_15px_rgba(70,214,200,0.1)] resize-none"
                                            />
                                        </div>
                                    </div>

                                </div>
                            </form>
                        </div>
                        {/* Footer */}
                        <div className="px-6 pt-2 pb-4 bg-[#04070A] flex justify-end gap-3 rounded-b-lg relative z-50">
                            {/* Gradient above footer */}
                            <div className="absolute -top-12 translate-y-px left-0 right-0 h-12 bg-gradient-to-t from-[#04070A] via-[#04070A]/80 to-transparent pointer-events-none" />
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                            >
                                {t('common.cancel', 'Скасувати')}
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleSubmit(e as any);
                                }}
                                disabled={loading}
                                className="px-4 py-2 rounded-lg bg-[#46D6C8] text-black font-semibold hover:opacity-90 hover:shadow-[0_0_30px_rgba(70,214,200,0.8)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? t('common.loading', 'Завантаження...') : t('common.save', 'Зберегти')}
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <GlassConfirmDialog
                open={!!deleteConfirmId}
                onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}
                title={t('gallery.confirm_delete_title', 'Видалити елемент')}
                description={t('gallery.confirm_delete', 'Ви впевнені, що хочете видалити цей елемент?')}
                confirmLabel={t('common.delete', 'Видалити')}
                cancelLabel={t('common.cancel', 'Скасувати')}
                variant="destructive"
                onConfirm={() => {
                    if (deleteConfirmId) deleteItem(deleteConfirmId);
                }}
            />
        </AdminShell>
    );
};

export default GalleryManager;