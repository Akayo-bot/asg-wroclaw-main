import { useState } from 'react';
import { Edit, Trash2, Image as ImageIcon, Video, X } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

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

    return (
        <>

            <div className="relative rounded-xl overflow-hidden bg-black/60 backdrop-blur-sm border border-white/10 transition-all duration-300 group hover:border-[#46D6C8]/50 h-full flex flex-col">
                {/* 1. ЗОБРАЖЕННЯ (Тут живе ефект) */}
                <div className="relative h-48 w-full overflow-hidden group/image shrink-0">
                    {item.file_type.startsWith('image') ? (
                        <div 
                            className="w-full h-full cursor-zoom-in"
                            onClick={() => setIsLightboxOpen(true)}
                        >
                            <img
                                src={item.thumbnail_url || item.file_url}
                                alt={getTitle(item)}
                                className="object-cover w-full h-full transition-transform duration-300 group-hover/image:scale-[1.03]"
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
                <div className="relative p-3 flex-1 flex flex-col">
                    <h3 className="text-base font-semibold text-white truncate mb-1 pr-16">
                        {getTitle(item)}
                    </h3>

                    {/* Зв'язок з подією */}
                    {item.event && (
                        <p className="text-xs text-[#46D6C8] mb-1 truncate pr-16">
                            {getEventTitle(item.event)}
                        </p>
                    )}

                    <p className="text-xs text-gray-400 mb-2 mt-auto">
                        {new Date(item.created_at).toLocaleDateString()}
                    </p>

                    {/* 🔥 КНОПКИ ДІЙ (Фіксовані внизу картки) */}
                    <div className="absolute bottom-3 right-3 flex space-x-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10">
                        {/* Кнопка Редагування (Edit) */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white hover:text-[#46D6C8] transition-all hover:scale-110 active:scale-95"
                            title={t('gallery.edit_item', 'Edit')}
                        >
                            <Edit className="w-4 h-4" />
                        </button>

                        {/* Кнопка Видалення (Delete) */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                            className="p-2 rounded-lg bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 transition-all hover:scale-110 active:scale-95"
                            title={t('gallery.delete', 'Delete')}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* LIGHTBOX (Просте модальне вікно) */}
            {isLightboxOpen && (
                <div 
                    className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button 
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img 
                        src={item.file_url} 
                        alt={getTitle(item)} 
                        className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
}
