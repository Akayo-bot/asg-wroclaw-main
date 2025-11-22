import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Image as ImageIcon, Video, Search, ChevronDown, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingScreen from '@/components/LoadingScreen';
import { Tables } from '@/integrations/supabase/types';
import DomeGallery from '@/components/admin/DomeGallery';
import ImageUploader from '@/components/admin/ImageUploader';
import CustomSelect from '@/components/admin/CustomSelect';

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
    file_type: string;
    thumbnail_url: string;
    event_id: string | null;
}

// Кастомный Dropdown для фильтра событий
const EventFilterDropdown = ({
    value,
    onChange,
    events
}: {
    value: string | null;
    onChange: (value: string | null) => void;
    events: Event[];
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const { t, language } = useI18n();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const getEventTitle = (event: Event) => {
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

    const options = [
        { value: null, label: t('gallery.all_events', 'Всі Події') },
        ...events.map(event => ({
            value: event.id,
            label: `${getEventTitle(event)} - ${formatEventDate(event.event_date)}`,
            event,
        })),
    ];

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    // Закрываем dropdown при клике вне его
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full md:w-64 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white flex justify-between items-center focus:outline-none focus:border-[#46D6C8]/50 focus:ring-1 focus:ring-[#46D6C8]/50 hover:border-[#46D6C8]/30 transition-all"
            >
                <span className="truncate">{selectedOption.label}</span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 rounded-lg border border-white/10 bg-[#04070A] shadow-xl max-h-60 overflow-y-auto">
                    {options.map((option) => (
                        <button
                            key={option.value || 'all'}
                            type="button"
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 cursor-pointer transition-colors first:rounded-t-lg last:rounded-b-lg ${option.value === value
                                ? 'bg-[#46D6C8] text-black font-semibold shadow-lg'
                                : 'text-white hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// Кастомный Dropdown для фильтра типов
const TypeFilterDropdown = ({ value, onChange }: { value: 'all' | 'image' | 'video'; onChange: (value: 'all' | 'image' | 'video') => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useI18n();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const options = [
        { value: 'all', label: t('gallery.all_types', 'Всі Типи') },
        { value: 'image', label: t('gallery.images', 'Фото') },
        { value: 'video', label: t('gallery.videos', 'Відео') },
    ];

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    // Закрываем dropdown при клике вне его
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full md:w-48 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white flex justify-between items-center focus:outline-none focus:border-[#46D6C8]/50 focus:ring-1 focus:ring-[#46D6C8]/50 hover:border-[#46D6C8]/30 transition-all"
            >
                <span>{selectedOption.label}</span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 rounded-lg border border-white/10 bg-[#04070A] shadow-xl max-h-60 overflow-y-auto">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onChange(option.value as 'all' | 'image' | 'video');
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 cursor-pointer transition-colors first:rounded-t-lg last:rounded-b-lg ${option.value === value
                                ? 'bg-[#46D6C8] text-black font-semibold shadow-lg'
                                : 'text-white hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

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
    const [eventFilter, setEventFilter] = useState<string | null>(null);
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

    // 🔥 ФІКС БЛОКУВАННЯ СКРОЛУ (JS Side Effect)
    useEffect(() => {
        if (isDialogOpen) {
            // 🔥 НОВИЙ ФІКС: Застосовуємо "броньований" клас до HTML та BODY
            document.body.classList.add('scroll-lock');
            document.documentElement.classList.add('scroll-lock'); // Додаємо і до HTML

            // Очищення
            return () => {
                document.body.classList.remove('scroll-lock');
                document.documentElement.classList.remove('scroll-lock');
            };
        }
    }, [isDialogOpen]);

    // 🔥 Функція завантаження випадкових зображень для DomeGallery
    // Завантажує ВСІ доступні зображення та заповнює 34 слоти випадковим вибором
    const fetchRandomImagesForDome = async () => {
        setIsLoadingDome(true);
        try {
            // 1. 🔥 Запитуємо ВСІ доступні фотографії (або більшу вибірку, наприклад, 100)
            const { data, error } = await supabase
                .from('gallery_items')
                .select('file_url, title_uk, title_en, title_ru, title_pl')
                .eq('file_type', 'image') // Тільки зображення
                .limit(100); // Завантажуємо до 100 для більшого вибору

            if (error) {
                console.error('Error fetching dome images:', error);
                setDomeImages([]);
                return;
            }

            const availableImages = (data || []).map(item => ({
                src: item.file_url,
                alt: item.title_uk || item.title_en || item.title_ru || item.title_pl || 'Gallery image'
            }));

            // 2. 🔥 Якщо фотографій менше 34, створюємо випадкову "начинку"
            const finalDomeImages: Array<{ src: string; alt: string }> = [];
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
            if (eventFilter && typeof eventFilter === 'string' && eventFilter.length > 0) {
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
                        .select('id, title_uk, title_ru, title_pl, title_en, event_date')
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
                    console.error('Error details:', {
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                        code: error.code,
                    });
                    throw error;
                }

                console.log('Successfully inserted gallery item:', data);

                toast({
                    title: t('common.success', 'Успіх'),
                    description: t('gallery.created', 'Елемент галереї створено успішно'),
                });
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

    const deleteItem = async (id: string) => {
        if (!confirm(t('gallery.confirm_delete', 'Ви впевнені, що хочете видалити цей елемент?'))) return;

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
    const selectedEvent = eventFilter ? events.find(e => e.id === eventFilter) : null;
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
        return eventFilter !== null || typeFilter !== 'all' || searchTerm.length > 0;
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
        <div className="p-8 space-y-8">
            {/* Шапка Сторінки */}
            <div className="flex items-center justify-between mb-8">
                {/* ЛІВА ЧАСТИНА (Заголовок) */}
                <div>
                    <h1 className="font-display text-3xl text-white mb-2">
                        {t('gallery.title', 'Media & Event Archive')}
                    </h1>
                    <p className="text-gray-400">
                        {selectedEvent
                            ? `${t('gallery.archive', 'Архів')}: ${getEventTitleForFilter(selectedEvent)} - ${formatEventDate(selectedEvent.event_date)}`
                            : t('gallery.description', 'Manage your gallery images and videos')
                        }
                    </p>
                </div>

            </div>

            {/* Блок Фільтрів та Пошуку */}
            <div className="flex flex-col gap-4 mb-8">
                {/* РЯДОК 1: ФІЛЬТРИ */}
                <div className="flex flex-wrap items-center gap-4">
                    {/* Фільтр Подій */}
                    <div className="w-full sm:w-auto">
                        <EventFilterDropdown
                            value={eventFilter}
                            onChange={setEventFilter}
                            events={events}
                        />
                    </div>

                    {/* Фільтр Типів Медіа */}
                    <div className="w-full sm:w-auto">
                        <TypeFilterDropdown value={typeFilter} onChange={setTypeFilter} />
                    </div>

                    {/* Кнопка "Додати Медіа" */}
                    <button
                        onClick={() => { resetForm(); setIsDialogOpen(true); }}
                        className="w-full sm:w-auto flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold 
                                   bg-[#46D6C8] text-black 
                                   transition-all duration-200
                                   hover:opacity-90 
                                   shadow-[0_0_15px_rgba(70,214,200,0.5)]"
                    >
                        <Plus className="w-5 h-5" />
                        {t('gallery.add_item', 'Додати Медіа')}
                    </button>
                </div>

                {/* РЯДОК 2: ПОШУК */}
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('gallery.search_placeholder', 'Search gallery items...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg 
                                   bg-white/5 border border-white/10 
                                   text-white placeholder-gray-400
                                   focus:outline-none focus:ring-2 focus:ring-[#46D6C8] focus:border-transparent transition-all"
                    />
                </div>
            </div>

            {/* УМОВНЕ ВІДОБРАЖЕННЯ: АБО DOME, АБО СПИСОК */}
            {!hasActiveFilters && (
                <div className="w-full h-[500px] my-8 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                    {isLoadingDome ? (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#46D6C8] mx-auto mb-4"></div>
                                <p>{t('gallery.loading_dome', 'Завантаження галереї...')}</p>
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

            {/* ОСНОВНА ТАБЛИЦЯ/СПИСОК (Завжди видима) */}
            <div className="mt-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                    {selectedEvent
                        ? `${t('gallery.archive', 'Архів події')}: ${getEventTitleForFilter(selectedEvent)}`
                        : t('gallery.all_files', 'Всі файли')
                    }
                </h2>

                {/* 🔥 КОМПАКТНИЙ СПИСОК: Використовуємо CSS Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredItems.map((item) => (
                        <div
                            key={item.id}
                            className="relative rounded-xl overflow-hidden 
                                   bg-black/60 backdrop-blur-sm border border-white/10 
                                   transition-all duration-300 
                                   group hover:border-[#46D6C8]/50"
                        >
                            {/* Блок Зображення */}
                            <div className="relative h-48 w-full overflow-hidden">
                                {item.file_type.startsWith('image') ? (
                                    <img
                                        src={item.thumbnail_url || item.file_url}
                                        alt={getTitle(item)}
                                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-[1.03]"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-black/40">
                                        <Video className="h-12 w-12 text-gray-400" />
                                    </div>
                                )}

                                {/* Іконка типу файлу */}
                                <span className="absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded bg-black/80 text-white/80 backdrop-blur-sm">
                                    {item.file_type.startsWith('image') ? (
                                        <span className="flex items-center gap-1">
                                            <ImageIcon className="h-3 w-3" />
                                            Image
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            <Video className="h-3 w-3" />
                                            Video
                                        </span>
                                    )}
                                </span>
                            </div>

                            {/* Текст та Футер */}
                            <div className="p-3">
                                <h3 className="text-base font-semibold text-white truncate mb-1">
                                    {getTitle(item)}
                                </h3>

                                {/* 🔥 НОВЕ: Зв'язок з подією */}
                                {item.event && (
                                    <p className="text-xs text-[#46D6C8] mb-1 truncate">
                                        {getEventTitle(item.event)}
                                    </p>
                                )}

                                <p className="text-xs text-gray-400 mb-2">
                                    {new Date(item.created_at).toLocaleDateString()}
                                </p>

                                {/* 🔥 КНОПКИ ДІЙ (Вони ПРИХОВАНІ за замовчуванням) */}
                                <div
                                    className="absolute inset-x-0 bottom-0 
                                           bg-black/80 backdrop-blur-sm 
                                           flex justify-end p-3 space-x-2 
                                           opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                >
                                    {/* Кнопка Редагування (Edit) */}
                                    <button
                                        onClick={() => editItem(item)}
                                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white hover:text-[#46D6C8] transition-all"
                                        title={t('gallery.edit_item', 'Edit')}
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>

                                    {/* Кнопка Видалення (Delete) */}
                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        className="p-2 rounded-lg bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 transition-all"
                                        title={t('gallery.delete', 'Delete')}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Пустий стан */}
                {filteredItems.length === 0 && (
                    <div className="rounded-xl p-8 border border-white/10 bg-black/60 backdrop-blur-sm text-center">
                        <p className="text-gray-400">{t('gallery.no_items', 'No gallery items found')}</p>
                    </div>
                )}
            </div>

            {/* Діалог для додавання/редагування */}
            {isDialogOpen && (
                <div
                    onClick={resetForm}
                    className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-2xl rounded-xl border border-[#46D6C8]/20 bg-black/80 backdrop-blur-sm shadow-[0_0_40px_rgba(70,214,200,0.2)] m-4 z-[501] max-h-[90vh] overflow-y-auto neon-scrollbar"
                    >
                        {/* Кнопка закриття (position: absolute) */}
                        <button
                            onClick={resetForm}
                            className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* 🔥 КОНТЕНТ: Створюємо зміщення (отступ от навбара) */}
                        <div className="p-6 pt-20">
                            {/* Заголовок модалки */}
                            <h2 className="text-xl font-display text-white border-b border-white/10 pb-4 mb-4">
                                {editingItem ? t('gallery.edit_item', 'Редагувати Медіа') : t('gallery.add_item', 'Додати Медіа')}
                            </h2>

                            <form
                                onSubmit={handleSubmit}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                                className="space-y-6"
                            >
                                {/* ======================================= */}
                                {/* БЛОК 1: ЗАВАНТАЖЕННЯ (Upload) */}
                                {/* ======================================= */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">Файл</h3>
                                        <p className="text-sm text-gray-400 mb-4">Завантажте фотографію чи відео.</p>
                                    </div>

                                    {/* 🔥 Завантажувач: ImageUploader */}
                                    <ImageUploader
                                        label="Медіафайл"
                                        currentUrl={formData.file_url}
                                        onUpload={(url) => setFormData({ ...formData, file_url: url })}
                                        bucket="media"
                                        folder="gallery"
                                        fileType={formData.file_type as 'image' | 'video'}
                                    />

                                    {/* 🔥 Dropdown Типу Файлу (Кастомний) */}
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <CustomSelect
                                                label="Тип файлу"
                                                value={formData.file_type}
                                                onChange={(value) => setFormData({ ...formData, file_type: value || 'image' })}
                                                options={[
                                                    { value: 'image', label: 'Image' },
                                                    { value: 'video', label: 'Video' }
                                                ]}
                                                required
                                            />
                                        </div>
                                        <p className="text-sm text-gray-400 flex-shrink-0">Вкажіть, що ви завантажуєте.</p>
                                    </div>

                                    {/* Thumbnail (опціонально) */}
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

                                {/* Розділювач */}
                                <hr className="border-white/10" />

                                {/* ======================================= */}
                                {/* БЛОК 2: ІНФОРМАЦІЯ (Data Entry) */}
                                {/* ======================================= */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">Деталі</h3>
                                    </div>

                                    {/* Подія (Опціонально) - Кастомний Select */}
                                    <CustomSelect
                                        label={`${t('gallery.event', 'Подія')} (${t('gallery.optional', 'опціонально')})`}
                                        value={formData.event_id}
                                        onChange={(value) => setFormData({ ...formData, event_id: value })}
                                        options={[
                                            { value: null, label: t('gallery.no_event', 'Без події') },
                                            ...events.map((event) => {
                                                const eventTitle = getEventTitle(event);
                                                const eventDate = formatEventDate(event.event_date);
                                                return {
                                                    value: event.id,
                                                    label: `${eventTitle} - ${eventDate}`
                                                };
                                            })
                                        ]}
                                        placeholder={t('gallery.no_event', 'Без події')}
                                    />
                                    <p className="text-xs text-gray-500">
                                        💡 <strong>{t('gallery.event_help', 'Використовується')}:</strong> {t('gallery.event_help_text', 'Пов\'язує медіа з конкретною подією для організації архіву.')}
                                    </p>

                                    {/* Заголовок (Title) - Тільки UKR */}
                                    <div>
                                        <label className="text-sm font-medium text-white/80 mb-2 block">
                                            {t('gallery.title_field', 'Заголовок')} (UKR)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title_uk}
                                            onChange={(e) => setFormData({ ...formData, title_uk: e.target.value })}
                                            placeholder={t('gallery.title_placeholder', 'Введіть заголовок')}
                                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#46D6C8]/50 focus:ring-1 focus:ring-[#46D6C8]/50 transition-all"
                                        />
                                    </div>

                                    {/* Опис (Description) - Тільки UKR */}
                                    <div>
                                        <label className="text-sm font-medium text-white/80 mb-2 block">
                                            {t('gallery.description_field', 'Опис')} (UKR)
                                        </label>
                                        <textarea
                                            value={formData.description_uk}
                                            onChange={(e) => setFormData({ ...formData, description_uk: e.target.value })}
                                            placeholder={t('gallery.description_placeholder', 'Введіть опис')}
                                            rows={4}
                                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#46D6C8]/50 focus:ring-1 focus:ring-[#46D6C8]/50 transition-all resize-none"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer / Кнопка Зберегти */}
                        <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-black/80 backdrop-blur-sm sticky bottom-0">
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
                                disabled={loading || !formData.file_url}
                                className="px-4 py-2 rounded-lg bg-[#46D6C8] text-black font-semibold hover:opacity-90 hover:shadow-[0_0_30px_rgba(70,214,200,0.8)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? t('common.loading', 'Завантаження...') : t('common.save', 'Зберегти')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GalleryManager;
