import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Image, Play, Calendar, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LoadingScreen from '@/components/LoadingScreen';

interface GalleryItem {
    id: string;
    file_url: string;
    file_type: string;
    thumbnail_url?: string;
    title_uk?: string;
    title_ru?: string;
    title_pl?: string;
    title_en?: string;
    description_uk?: string;
    description_ru?: string;
    description_pl?: string;
    description_en?: string;
    status: string;
    created_at: string;
    updated_at: string;
}

const GalleryPage = () => {
    const { t, language } = useI18n();
    const { toast } = useToast();
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');

    const filters = [
        { key: 'all', label: t('pages.gallery.filters.all', 'All') },
        { key: 'image', label: t('pages.gallery.filters.photos', 'Photos') },
        { key: 'video', label: t('pages.gallery.filters.videos', 'Videos') },
    ];

    useEffect(() => {
        fetchGalleryItems();
    }, []);

    const fetchGalleryItems = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from('gallery_items')
                .select('*')
                .eq('status', 'published')
                .order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching gallery items:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load gallery items',
                    variant: 'destructive',
                });
            } else {
                setGalleryItems(data || []);
            }
        } catch (error) {
            console.error('Error fetching gallery items:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTitleForLanguage = (item: GalleryItem) => {
        switch (language) {
            case 'uk': return item.title_uk;
            case 'ru': return item.title_ru;
            case 'pl': return item.title_pl;
            case 'en': return item.title_en;
            default: return item.title_uk;
        }
    };

    const getDescriptionForLanguage = (item: GalleryItem) => {
        switch (language) {
            case 'uk': return item.description_uk;
            case 'ru': return item.description_ru;
            case 'pl': return item.description_pl;
            case 'en': return item.description_en;
            default: return item.description_uk;
        }
    };

    const filteredItems = galleryItems.filter(item =>
        activeFilter === 'all' || item.file_type === activeFilter
    );

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
                            {t('pages.gallery.title', 'Gallery')}
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            {t('pages.gallery.subtitle', 'Photos and videos from our missions')}
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

                    {/* Gallery Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map((item) => {
                            const title = getTitleForLanguage(item) || 'Untitled';
                            const description = getDescriptionForLanguage(item);

                            return (
                                <Card key={item.id} className="glass-panel tactical-lift cursor-target overflow-hidden">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <div className="relative">
                                                <img
                                                    src={item.thumbnail_url || item.file_url}
                                                    alt={title}
                                                    className="w-full h-48 object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    {item.file_type === 'video' ? (
                                                        <Play className="w-12 h-12 text-white" />
                                                    ) : (
                                                        <Image className="w-12 h-12 text-white" />
                                                    )}
                                                </div>
                                                <div className="absolute top-2 left-2">
                                                    <Badge variant={item.file_type === 'video' ? 'destructive' : 'secondary'}>
                                                        {item.file_type === 'video'
                                                            ? t('pages.gallery.badge.video', 'VIDEO')
                                                            : t('pages.gallery.badge.photo', 'PHOTO')
                                                        }
                                                    </Badge>
                                                </div>
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl">
                                            {item.file_type === 'video' ? (
                                                <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                                                    <Play className="w-16 h-16 text-white" />
                                                    <span className="ml-2 text-white">
                                                        {t('pages.gallery.video_loading', 'Video will be loaded')}
                                                    </span>
                                                </div>
                                            ) : (
                                                <img
                                                    src={item.file_url}
                                                    alt={title}
                                                    className="w-full h-auto rounded-lg"
                                                />
                                            )}
                                        </DialogContent>
                                    </Dialog>

                                    <CardContent className="p-4">
                                        <h3 className="font-rajdhani text-lg font-bold mb-2 line-clamp-2">
                                            {title}
                                        </h3>
                                        {description && (
                                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                                {description}
                                            </p>
                                        )}
                                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(item.created_at).toLocaleDateString(language)}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Empty State */}
                    {filteredItems.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">
                                {t('pages.gallery.noMedia', 'No media available')}
                            </p>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center glass-panel p-6 rounded-lg">
                            <div className="text-2xl font-rajdhani font-bold text-primary mb-1">
                                {galleryItems.filter(item => item.file_type === 'image').length}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {t('pages.gallery.stats.photos', 'Photos')}
                            </div>
                        </div>
                        <div className="text-center glass-panel p-6 rounded-lg">
                            <div className="text-2xl font-rajdhani font-bold text-primary mb-1">
                                {galleryItems.filter(item => item.file_type === 'video').length}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {t('pages.gallery.stats.videos', 'Videos')}
                            </div>
                        </div>
                        <div className="text-center glass-panel p-6 rounded-lg">
                            <div className="text-2xl font-rajdhani font-bold text-primary mb-1">
                                {galleryItems.length}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {t('pages.gallery.stats.total', 'Total Items')}
                            </div>
                        </div>
                        <div className="text-center glass-panel p-6 rounded-lg">
                            <div className="text-2xl font-rajdhani font-bold text-primary mb-1">
                                {new Date().getFullYear()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {t('pages.gallery.stats.year', 'Current Year')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default GalleryPage;