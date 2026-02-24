import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Layout } from '@/components/Layout';
import { useI18n } from '@/contexts/I18nContext';
import { SearchBarNeon } from '@/components/admin/SearchBarNeon';
import { NeonPopoverList } from '@/components/admin/NeonPopoverList';
import { MarqueeText } from '@/components/ui/MarqueeText';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LoadingScreen from '@/components/LoadingScreen';
import RadarLoader from '@/components/RadarLoader';
import DomeGallery from '@/components/admin/DomeGallery';
import { Tables } from '@/integrations/supabase/types';
import { Image as ImageIcon, Video, X, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import downloadAnimation from '@/assets/lottie/downloadbutton.json';

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

interface UserGalleryCardProps {
    item: GalleryItem;
    language: string;
}

const UserGalleryCard = ({ item, language }: UserGalleryCardProps) => {
    const { t } = useI18n();
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const downloadLottieRef = useRef<LottieRefCurrentProps>(null);

    useEffect(() => {
        if (isLightboxOpen) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }
        return () => {};
    }, [isLightboxOpen]);

    useEffect(() => {
        return () => {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, []);

    const handleCloseLightbox = useCallback(() => {
        setIsLightboxOpen(false);
    }, []);

    const onLightboxExitComplete = useCallback(() => {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }, []);

    const getTitle = () => {
        const titles: Record<string, string | null | undefined> = {
            uk: item.title_uk, ru: item.title_ru, pl: item.title_pl, en: item.title_en || item.title_uk,
        };
        return titles[language] || item.title_uk || 'Untitled';
    };

    const getEventTitle = (event: NonNullable<GalleryItem['event']>) => {
        const titles: Record<string, string | null | undefined> = {
            uk: event.title_uk, ru: event.title_ru, pl: event.title_pl, en: event.title_en || event.title_uk,
        };
        return titles[language] || event.title_uk || 'Untitled';
    };

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const response = await fetch(item.file_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = item.file_url.split('/').pop() || `image-${item.id}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch {
            const link = document.createElement('a');
            link.href = item.file_url;
            link.target = '_blank';
            link.download = item.file_url.split('/').pop() || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const formattedDate = new Date(item.created_at).toLocaleDateString().replace(/\//g, '.');

    return (
        <>
            <div className="relative rounded-xl overflow-hidden bg-black/30 backdrop-blur-sm border border-white/10 transition-all duration-300 group/card hover:border-[#46D6C8]/30 hover:shadow-[0_0_30px_rgba(70,214,200,0.1)] h-full flex flex-col">
                <div className="relative h-48 w-full overflow-hidden group/image shrink-0">
                    {item.file_type.startsWith('image') ? (
                        <div
                            className="w-full h-full cursor-zoom-in"
                            onClick={() => setIsLightboxOpen(true)}
                            role="button"
                            tabIndex={0}
                            aria-label={`${t('gallery.open_image', 'Открыть')}: ${getTitle()}`}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsLightboxOpen(true); }}
                        >
                            <motion.img
                                src={item.thumbnail_url || item.file_url}
                                alt={getTitle()}
                                layoutId={`gallery-image-${item.id}`}
                                className="object-cover w-full h-full"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full bg-black/40">
                            <Video className="h-12 w-12 text-gray-400" />
                        </div>
                    )}

                    <span className="absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded bg-black/80 text-white/80 backdrop-blur-sm pointer-events-none">
                        {item.file_type.startsWith('image') ? (
                            <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Image</span>
                        ) : (
                            <span className="flex items-center gap-1"><Video className="h-3 w-3" /> Video</span>
                        )}
                    </span>
                </div>

                <div className="relative p-4 flex-1 flex flex-col">
                    <h3 className="text-lg font-semibold text-[#46D6C8] truncate mb-1 pr-10">
                        {getTitle()}
                    </h3>

                    {item.event && (
                        <p className="text-base text-amber-400 font-medium mb-1 truncate pr-10">
                            {getEventTitle(item.event)}
                        </p>
                    )}

                    <p className="text-sm text-[#C2C2C2] mb-2 mt-auto">
                        {formattedDate}
                    </p>

                    <div className="absolute bottom-3 right-3 flex space-x-2 opacity-0 translate-y-2 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-300 z-10">
                        <div
                            onClick={handleDownload}
                            onMouseEnter={() => downloadLottieRef.current?.play()}
                            onMouseLeave={() => downloadLottieRef.current?.stop()}
                            className="h-7 w-7 flex items-center justify-center p-0 rounded-md bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/20 hover:shadow-[0_0_10px_rgba(70,214,200,0.35)] transition-all duration-200 cursor-target active:scale-95 group/lottie"
                            title={t('common.download', 'Скачать')}
                            role="button"
                            tabIndex={0}
                            aria-label={t('common.download', 'Скачать')}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDownload(e as any); }}
                        >
                            <div className="w-5 h-5 flex items-center justify-center">
                                <Lottie
                                    lottieRef={downloadLottieRef}
                                    animationData={downloadAnimation}
                                    loop={false}
                                    autoplay={false}
                                    className="w-full h-full scale-150"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {createPortal(
                <AnimatePresence onExitComplete={onLightboxExitComplete}>
                    {isLightboxOpen && (
                        <motion.div
                            key="lightbox-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
                            onClick={handleCloseLightbox}
                        >
                            <motion.div
                                className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ delay: 0.2 }}
                                    onClick={handleCloseLightbox}
                                    className="absolute -top-12 -right-12 text-white/70 hover:text-white transition-colors p-2 flex items-center gap-2 group"
                                    aria-label={t('common.close', 'Закрыть')}
                                >
                                    <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                        {t('common.close', 'Закрити')}
                                    </span>
                                    <div className="bg-white/10 p-2 rounded-full group-hover:bg-white/20">
                                        <X size={24} />
                                    </div>
                                </motion.button>

                                <motion.img
                                    src={item.file_url}
                                    alt={getTitle()}
                                    layoutId={`gallery-image-${item.id}`}
                                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10"
                                    transition={{ type: 'spring', stiffness: 280, damping: 35, mass: 0.8 }}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

const GalleryPage = () => {
    const { t, language } = useI18n();
    const { toast } = useToast();
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [domeImages, setDomeImages] = useState<Array<{ src: string; alt: string }>>([]);
    const [isLoadingDome, setIsLoadingDome] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [eventFilter, setEventFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        fetchEvents();
        fetchItems();
    }, [eventFilter, typeFilter]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        fetchRandomImagesForDome();
    }, []);

    const fetchRandomImagesForDome = async () => {
        setIsLoadingDome(true);
        try {
            const { data, error } = await supabase
                .from('gallery_items')
                .select('file_url, thumbnail_url, title_uk, title_en, title_ru, title_pl')
                .eq('file_type', 'image')
                .eq('status', 'published');

            if (error) {
                console.error('Error fetching dome images:', error);
                setDomeImages([]);
                return;
            }

            const availableImages = (data || []).map(item => ({
                src: item.thumbnail_url || item.file_url,
                alt: item.title_uk || item.title_en || item.title_ru || item.title_pl || 'Gallery image',
                fullSrc: item.file_url,
            }));

            const finalDomeImages: Array<{ src: string; alt: string; fullSrc?: string }> = [];
            const numSlots = 34;

            if (availableImages.length > 0) {
                for (let i = 0; i < numSlots; i++) {
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

            let query = supabase
                .from('gallery_items')
                .select('*')
                .eq('status', 'published');

            if (eventFilter && eventFilter !== 'all') {
                query = query.eq('event_id', eventFilter);
            }

            if (typeFilter !== 'all') {
                query = query.ilike('file_type', `${typeFilter}%`);
            }

            query = query.order('created_at', { ascending: false });

            const { data: itemsData, error: itemsError } = await query;
            if (itemsError) throw itemsError;

            const eventIds = [...new Set(
                (itemsData || [])
                    .map((item: any) => item.event_id)
                    .filter((id: string | null | undefined): id is string =>
                        typeof id === 'string' && id.length > 0 && id !== 'undefined' && id !== 'null'
                    )
            )];

            let eventsData: Event[] = [];
            if (eventIds.length > 0 && eventIds.every(id => typeof id === 'string' && id.length > 0)) {
                try {
                    const { data: evts, error: evtsError } = await supabase
                        .from('events')
                        .select('*')
                        .in('id', eventIds);

                    if (!evtsError) eventsData = evts || [];
                } catch (error) {
                    console.warn('Error in events query:', error);
                }
            }

            const eventsMap = new Map(eventsData.map(event => [event.id, event]));

            const transformedData = (itemsData || []).map((item: any) => ({
                ...item,
                event: item.event_id ? (eventsMap.get(item.event_id) || null) : null,
            }));

            setItems(transformedData as GalleryItem[]);
        } catch (error) {
            console.error('Error fetching gallery items:', error);
            toast({
                title: t('common.error', 'Ошибка'),
                description: t('gallery.fetch_error', 'Не удалось загрузить элементы галереи'),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const getTitle = (item: GalleryItem) => {
        const titles: Record<string, string | null | undefined> = {
            uk: item.title_uk, ru: item.title_ru, pl: item.title_pl, en: item.title_uk,
        };
        return titles[language] || item.title_uk || 'Untitled';
    };

    const getEventTitle = (event: Event | null | undefined) => {
        if (!event) return null;
        const titles: Record<string, string | null | undefined> = {
            uk: event.title_uk, ru: event.title_ru, pl: event.title_pl, en: event.title_en || event.title_uk,
        };
        return titles[language] || event.title_uk || 'Untitled';
    };

    const formatEventDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('uk-UA', {
            day: '2-digit', month: '2-digit', year: 'numeric',
        });
    };

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            if (!searchTerm) return true;
            return getTitle(item).toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [items, searchTerm, language]);

    const hasActiveFilters = useMemo(() => {
        return eventFilter !== 'all' || typeFilter !== 'all' || searchTerm.length > 0;
    }, [eventFilter, typeFilter, searchTerm]);

    const domeConfig = useMemo(() => {
        if (isMobile) {
            return {
                fit: 0.58, minRadius: 340, padFactor: 0.2, dragSensitivity: 18,
                segments: 22, openedImageWidth: '85vw', openedImageHeight: '70vh',
                imageBorderRadius: '18px', openedImageBorderRadius: '22px',
            };
        }
        return {
            fit: 0.52, minRadius: 550, padFactor: 0.22, dragSensitivity: 18,
            segments: 30, openedImageWidth: '420px', openedImageHeight: '420px',
            imageBorderRadius: '28px', openedImageBorderRadius: '32px',
        };
    }, [isMobile]);

    if (loading && items.length === 0) {
        return <LoadingScreen label="SCANNING TARGETS…" size={140} />;
    }

    return (
        <Layout>
            <div className="min-h-screen py-12">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="text-center mb-12">
                        <h1 className="font-rajdhani text-4xl md:text-5xl font-bold text-white mb-4">
                            {t('pages.gallery.title', 'Галерея')}
                        </h1>
                        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                            {t('pages.gallery.subtitle', 'Фото и видео с наших миссий')}
                        </p>
                    </div>

                    <SearchBarNeon
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder={t('gallery.search_placeholder', 'Поиск в галерее...')}
                    />

                    <div className="mx-auto max-w-4xl pb-3 sm:pb-4 mt-3 sm:mt-4">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <NeonPopoverList
                                value={eventFilter}
                                onChange={(v) => setEventFilter(v)}
                                disablePortal={true}
                                options={[
                                    { id: "all", label: t('gallery.all_events', 'Все события'), textColor: "text-neutral-300", hoverColor: "teal" },
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
                                        hoverColor: "emerald" as const,
                                    })),
                                ]}
                                color="teal"
                                minW={320}
                            />

                            <NeonPopoverList
                                value={typeFilter}
                                onChange={(v) => setTypeFilter(v as any)}
                                disablePortal={true}
                                options={[
                                    { id: "all", label: t('gallery.all_types', 'Все типы'), textColor: "text-neutral-300", hoverColor: "teal" },
                                    { id: "image", label: t('gallery.images', 'Фото'), textColor: "text-emerald-400", hoverColor: "emerald" },
                                    { id: "video", label: t('gallery.videos', 'Видео'), textColor: "text-amber-400", hoverColor: "amber" },
                                ]}
                                color="teal"
                                minW={140}
                            />
                        </div>
                    </div>

                    <div className="mx-auto max-w-[1400px] py-4 sm:py-6 mt-4 sm:mt-6 relative">
                        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(70,214,200,.08),transparent_70%)] opacity-50 rounded-2xl" />

                        {!hasActiveFilters && (
                            <div className="w-full h-[500px] mb-8 rounded-xl overflow-hidden border border-[#46D6C8]/20 bg-black/40 shadow-[0_0_25px_rgba(70,214,200,0.05)]">
                                {isLoadingDome ? (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        <RadarLoader label={t('gallery.loading_dome', 'Загрузка галереи...')} size={80} />
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
                                        <p>{t('gallery.no_images_for_dome', 'Нет изображений для отображения')}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredItems.map((item) => (
                                <UserGalleryCard
                                    key={item.id}
                                    item={item}
                                    language={language}
                                />
                            ))}
                        </div>

                        {filteredItems.length === 0 && (
                            <div className="rounded-xl p-8 border border-white/10 bg-black/60 backdrop-blur-sm text-center">
                                <p className="text-gray-400">{t('gallery.no_items', 'Элементов галереи не найдено')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default GalleryPage;
