import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Edit, Image as ImageIcon, Video, X } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import downloadAnimation from "@/assets/lottie/downloadbutton.json";
import { AnimatedDeleteButton } from './AnimatedDeleteButton';

interface GalleryItem {
    id: string;
    title_uk: string;
    title_en?: string;
    title_ru?: string;
    title_pl?: string;
    description_uk?: string;
    file_url: string;
    file_type: string;
    thumbnail_url?: string;
    created_at: string;
    event_id?: string;
    event?: {
        id: string;
        title_uk: string;
        title_en?: string;
        title_ru?: string;
        title_pl?: string;
        event_date: string;
    } | null;
}

interface GalleryCardProps {
    item: GalleryItem;
    language: 'uk' | 'en' | 'ru' | 'pl';
    onEdit: (item: GalleryItem) => void;
    onDelete: (id: string) => void;
}

export default function GalleryCard({ item, language, onEdit, onDelete }: GalleryCardProps) {
    const { t } = useI18n();
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const downloadLottieRef = useRef<LottieRefCurrentProps>(null);

    // Lock scroll when lightbox is open
    useEffect(() => {
        if (isLightboxOpen) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            // Apply styles to prevent scrolling and layout shift
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }
        // Note: Cleanup is intentionally handled in onLightboxExitComplete to prevent
        // content jump during the exit animation.
        return () => {};
    }, [isLightboxOpen]);
    
    // Safety cleanup on unmount
    useEffect(() => {
        return () => {
             document.documentElement.style.overflow = '';
             document.body.style.overflow = '';
             document.body.style.paddingRight = '';
        };
    }, []);

    const handleOpenLightbox = () => {
        setIsLightboxOpen(true);
    };

    const handleCloseLightbox = useCallback(() => {
        setIsLightboxOpen(false);
    }, []);

    const onLightboxExitComplete = useCallback(() => {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }, []);

    const getTitle = (item: GalleryItem) => {
        const titles = {
            uk: item.title_uk,
            ru: item.title_ru,
            pl: item.title_pl,
            en: item.title_en || item.title_uk, // fallback
        };
        return titles[language] || item.title_uk || 'Untitled';
    };

    const getEventTitle = (event: NonNullable<GalleryItem['event']>) => {
        const titles = {
            uk: event.title_uk,
            ru: event.title_ru,
            pl: event.title_pl,
            en: event.title_en || event.title_uk,
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
            // Extract filename from URL or use title
            const filename = item.file_url.split('/').pop() || `image-${item.id}`;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback for cross-origin issues if fetch fails
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
                {/* 1. ЗОБРАЖЕННЯ (Тут живе ефект) */}
                <div className="relative h-48 w-full overflow-hidden group/image shrink-0">
                    {item.file_type.startsWith('image') ? (
                        <div 
                            className="w-full h-full cursor-zoom-in"
                            onClick={handleOpenLightbox}
                        >
                            <motion.img
                                src={item.thumbnail_url || item.file_url}
                                alt={getTitle(item)}
                                layoutId={`image-${item.id}`}
                                className="object-cover w-full h-full"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full bg-black/40">
                            <Video className="h-12 w-12 text-gray-400" />
                        </div>
                    )}

                    {/* Іконка типу файлу */}
                    <span className="absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded bg-black/80 text-white/80 backdrop-blur-sm pointer-events-none">
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

                {/* 2. ТЕКСТ (Він залишається чистим) */}
                <div className="relative p-4 flex-1 flex flex-col">
                    <h3 className="text-lg font-semibold text-[#46D6C8] truncate mb-1 pr-16">
                        {getTitle(item)}
                    </h3>

                    {/* Зв'язок з подією */}
                    {item.event && (
                        <p className="text-base text-amber-400 font-medium mb-1 truncate pr-16">
                            {getEventTitle(item.event)}
                        </p>
                    )}

                    <p className="text-sm text-[#C2C2C2] mb-2 mt-auto">
                        {formattedDate}
                    </p>

                    {/* 🔥 КНОПКИ ДІЙ (Фіксовані внизу картки) */}
                    <div className="absolute bottom-3 right-3 flex space-x-2 opacity-0 translate-y-2 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-300 z-10">
                        {/* Кнопка Скачування (Download) - Lottie */}
                        <div
                            onClick={handleDownload}
                            onMouseEnter={() => downloadLottieRef.current?.play()}
                            onMouseLeave={() => downloadLottieRef.current?.stop()}
                            className="h-7 w-7 flex items-center justify-center p-0 rounded-md bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/20 hover:shadow-[0_0_10px_rgba(70,214,200,0.35)] transition-all duration-200 cursor-target active:scale-95 group/lottie"
                            title={t('common.download', 'Download')}
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

                        {/* Кнопка Редагування (Edit) */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                            className="group/edit h-7 w-7 flex items-center justify-center p-0 rounded-md bg-sky-500/10 border border-sky-400/30 text-sky-300 hover:bg-sky-500/20 hover:shadow-[0_0_10px_rgba(56,189,248,.35)] transition-all duration-200 cursor-target"
                            title={t('gallery.edit_item', 'Edit')}
                        >
                            <Edit className="h-4 w-4 transition-transform duration-200 group-hover/edit:animate-edit-write group-hover/edit:drop-shadow-[0_0_6px_rgba(56,189,248,.8)]" />
                        </button>

                        {/* Кнопка Видалення (Delete) */}
                        <div onClick={(e) => e.stopPropagation()}>
                             <AnimatedDeleteButton
                                onClick={() => onDelete(item.id)}
                                size="xs"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* LIGHTBOX (Fixed Fullscreen Overlay via Portal) */}
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
                            {/* Image Wrapper */}
                            <motion.div 
                                className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Close Button (Relative to image, offset slightly) */}
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ delay: 0.2 }}
                                    onClick={handleCloseLightbox}
                                    className="absolute -top-12 -right-12 text-white/70 hover:text-white transition-colors p-2 flex items-center gap-2 group"
                                >
                                    <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">Закрити</span>
                                    <div className="bg-white/10 p-2 rounded-full group-hover:bg-white/20">
                                        <X size={24} />
                                    </div>
                                </motion.button>

                                <motion.img 
                                    src={item.file_url} 
                                    alt={getTitle(item)} 
                                    layoutId={`image-${item.id}`}
                                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10"
                                    transition={{ type: "spring", stiffness: 280, damping: 35, mass: 0.8 }}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
